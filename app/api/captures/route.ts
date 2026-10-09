// Voice notes in. POST stores the recording and its details and answers
// quickly, so the phone's queue can count the note as sent; processing is a
// separate call (./[id]/process). The id comes from the phone, so a retry of
// the same note never makes a second capture. GET lists notes still waiting
// for review. Signed-in users only (the proxy turns everyone else away).
// Never logs transcripts, names or phone numbers.
import { authConfigured } from "@/lib/auth/config";
import { checkRateLimit, rateLimitWindowStart } from "@/lib/captures/rate-limit";
import { validateCaptureUpload } from "@/lib/captures/validate";
import { audioPath, draftFromRow, getCapture, OPEN_STATUSES, CAPTURE_COLUMNS, type CaptureRow } from "@/lib/data/captures";
import { createClient } from "@/lib/supabase/server";

const noStore = { "Cache-Control": "private, no-store" };

async function signedIn() {
  if (!authConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  return userId ? { supabase, userId } : null;
}

export async function POST(request: Request) {
  const session = await signedIn();
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { supabase, userId } = session;

  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "Send the recording as a form." }, { status: 400 });
  const file = form.get("audio");
  const fields = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
  const checked = validateCaptureUpload(file instanceof File ? file : null, fields);
  if (!checked.ok) return Response.json({ error: checked.error.message }, { status: checked.error.status });
  const note = checked.value;

  // The same note sent again (a retry after a dropped connection).
  const existing = await getCapture(supabase, note.id);
  if (existing) return Response.json({ id: existing.id, status: existing.status }, { headers: noStore });

  // 60 notes an hour, counted from the user's own captures.
  const { data: oldest, count } = await supabase
    .from("captures")
    .select("created_at", { count: "exact" })
    .gte("created_at", rateLimitWindowStart())
    .order("created_at", { ascending: true })
    .limit(1);
  const limit = checkRateLimit({ countInWindow: count ?? 0, oldestInWindow: oldest?.[0]?.created_at ?? null });
  if (!limit.allowed) {
    return Response.json(
      { error: "That's 60 notes in the last hour." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const path = audioPath(userId, note.id, note.mime);
  const stored = await supabase.storage.from("audio").upload(path, file as File, { contentType: note.mime, upsert: true });
  if (stored.error) {
    console.error("capture upload failed", { captureId: note.id, status: "storage" });
    return Response.json({ error: "The recording couldn't be stored." }, { status: 503 });
  }

  const row = {
    id: note.id,
    audio_path: path,
    audio_mime: note.mime,
    duration_seconds: note.durationSeconds,
    recorded_at: note.recordedAt,
    recorded_timezone: note.timezone,
    lat: note.location?.lat ?? null,
    lng: note.location?.lng ?? null,
    location_accuracy_m: note.location?.accuracyM ?? null,
    event_id: note.eventId,
    status: "uploaded",
  };
  let { error } = await supabase.from("captures").insert(row);
  // An event started offline never reached the database: keep the take anyway.
  if (error?.code === "23503" && note.eventId) ({ error } = await supabase.from("captures").insert({ ...row, event_id: null }));
  if (error) {
    // Two copies of the same note arriving together: the first one won.
    if (error.code === "23505") return Response.json({ id: note.id, status: "uploaded" }, { headers: noStore });
    console.error("capture insert failed", { captureId: note.id, status: "database" });
    return Response.json({ error: "The note couldn't be saved." }, { status: 503 });
  }
  return Response.json({ id: note.id, status: "uploaded" }, { status: 201, headers: noStore });
}

// Notes recorded but not yet saved to a person or discarded, oldest first.
export async function GET() {
  const session = await signedIn();
  if (!session) return Response.json({ notes: [] }, { headers: noStore });
  const { data } = await session.supabase
    .from("captures")
    .select(CAPTURE_COLUMNS)
    .is("person_id", null)
    .in("status", OPEN_STATUSES)
    .not("audio_path", "is", null)
    .order("recorded_at", { ascending: true })
    .limit(50);
  const notes = ((data ?? []) as unknown as CaptureRow[]).map((row) => {
    const draft = draftFromRow(row);
    return {
      id: row.id,
      recordedAt: row.recorded_at,
      status: row.status,
      name: draft.person.full_name || null,
      preview: row.transcript ? row.transcript.slice(0, 120) : null,
    };
  });
  return Response.json({ notes }, { headers: noStore });
}
