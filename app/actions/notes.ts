"use server";

// Deciding on a voice note: save it as a new person, add it to someone you've
// already met, or discard it. Plus "Met again" notes typed on a profile.
// Row level security keeps every read and write to the signed-in user.
import { revalidatePath } from "next/cache";
import type { SaveResult } from "@/app/actions/people";
import { getCapture } from "@/lib/data/captures";
import { usingSampleData } from "@/lib/data/people";
import { reverseGeocode } from "@/lib/geo/reverse-geocode";
import { cleanMentions, mentionedPerson } from "@/lib/people/mentioned";
import { isPersonId, PersonInputSchema, type PersonInput } from "@/lib/people/validate";
import { createClient } from "@/lib/supabase/server";

const NOT_SAVED = "That didn’t save. Check your connection and try again.";

// Fields a later note may fill on someone already saved: only the empty ones,
// so nothing typed earlier is overwritten.
const FILLABLE = [
  "phone",
  "birthday_month",
  "birthday_day",
  "birthday_year",
  "follow_up_note",
  "follow_up_date",
  "relationship",
] as const;

export async function saveNote(
  captureId: string,
  input: unknown,
  {
    cityByHand = false,
    existingPersonId = null,
    alsoSave = [],
  }: { cityByHand?: boolean; existingPersonId?: string | null; alsoSave?: string[] } = {},
): Promise<SaveResult> {
  const parsed = PersonInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the highlighted fields." };
  if (usingSampleData()) return { ok: true, id: existingPersonId, preview: true };
  if (!isPersonId(captureId)) return { ok: false, error: "No such note." };

  const supabase = await createClient();
  const capture = await getCapture(supabase, captureId);
  if (!capture) return { ok: false, error: "No such note." };
  if (capture.status === "confirmed" || capture.status === "discarded") {
    return { ok: false, error: "This note has already been saved or discarded." };
  }

  let person: PersonInput = parsed.data;
  // The pipeline already looked the place up permanently; only a moved pin
  // needs it again.
  const moved = person.lat !== capture.lat || person.lng !== capture.lng;
  if (moved && !cityByHand && person.lat !== null && person.lng !== null) {
    const place = await reverseGeocode(person.lat, person.lng).catch(() => null);
    if (place) person = { ...person, place_name: place.place_name, city: place.city ?? person.city, region: place.region, country: place.country ?? person.country };
  }

  let personId: string;
  if (existingPersonId) {
    if (!isPersonId(existingPersonId)) return { ok: false, error: "That person no longer exists." };
    const { data: existing } = await supabase.from("people").select("*").eq("id", existingPersonId).maybeSingle();
    if (!existing) return { ok: false, error: "That person no longer exists." };
    const fill: Record<string, unknown> = {};
    for (const key of FILLABLE) if (existing[key] === null && person[key] !== null) fill[key] = person[key];
    const extras = { ...person.extras, ...(existing.extras as Record<string, string>) };
    if (JSON.stringify(extras) !== JSON.stringify(existing.extras)) fill.extras = extras;
    const tags = [...(existing.tags as string[])];
    for (const tag of person.tags) if (!tags.some((t) => t.toLowerCase() === tag.toLowerCase())) tags.push(tag);
    if (tags.length !== (existing.tags as string[]).length) fill.tags = tags.slice(0, 20);
    if (Object.keys(fill).length) {
      const { error } = await supabase.from("people").update(fill).eq("id", existingPersonId);
      if (error) return { ok: false, error: NOT_SAVED };
    }
    personId = existingPersonId;
  } else {
    const { data, error } = await supabase.from("people").insert(person).select("id").single();
    if (error || !data) return { ok: false, error: NOT_SAVED };
    personId = data.id as string;
  }

  const { error } = await supabase
    .from("captures")
    .update({ person_id: personId, status: "confirmed", first_meeting: !existingPersonId })
    .eq("id", captureId);
  if (error) return { ok: false, error: NOT_SAVED };

  // Others the note named, if the user chose to save them too.
  let also = 0;
  const names = cleanMentions(alsoSave, person.full_name);
  if (names.length) {
    const { data: added } = await supabase.from("people").insert(names.map((n) => mentionedPerson(n, person))).select("id");
    also = added?.length ?? 0;
  }

  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);
  return { ok: true, id: personId, also };
}

// Discarding deletes the recording and the transcript, as the dialog says.
export async function discardNote(captureId: string): Promise<{ ok: boolean; error?: string }> {
  if (usingSampleData()) return { ok: true };
  if (!isPersonId(captureId)) return { ok: false, error: "No such note." };
  const supabase = await createClient();
  const capture = await getCapture(supabase, captureId);
  if (!capture) return { ok: true };
  if (capture.status === "confirmed") return { ok: false, error: "This note is already saved." };
  if (capture.audio_path) await supabase.storage.from("audio").remove([capture.audio_path]);
  const { error } = await supabase.from("captures").delete().eq("id", captureId);
  if (error) return { ok: false, error: "That didn’t discard. Check your connection and try again." };
  return { ok: true };
}

// "Met again": a short typed note on a profile, stamped with now and, when the
// phone shares it, where you are.
export async function addMeeting(
  personId: string,
  note: string,
  { timeZone = null, location = null }: { timeZone?: string | null; location?: { lat: number; lng: number; accuracyM: number | null } | null } = {},
): Promise<{ ok: true; place: { place_name: string | null; city: string | null } | null } | { ok: false; error: string }> {
  const text = note.trim();
  if (!text) return { ok: false, error: "Write what's new first." };
  if (text.length > 2000) return { ok: false, error: "Keep it under 2,000 characters." };
  if (usingSampleData()) return { ok: true, place: null };
  if (!isPersonId(personId)) return { ok: false, error: "That person no longer exists." };

  const valid = (n: number, max: number) => Number.isFinite(n) && Math.abs(n) <= max;
  const at = location && valid(location.lat, 90) && valid(location.lng, 180) ? location : null;
  const place = at ? await reverseGeocode(at.lat, at.lng).catch(() => null) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("captures").insert({
    person_id: personId,
    transcript: text,
    recorded_at: new Date().toISOString(),
    recorded_timezone: timeZone,
    lat: at?.lat ?? null,
    lng: at?.lng ?? null,
    location_accuracy_m: at?.accuracyM ?? null,
    geocode: place,
    status: "confirmed",
  });
  if (error) return { ok: false, error: NOT_SAVED };
  revalidatePath(`/people/${personId}`);
  return { ok: true, place: place && { place_name: place.place_name, city: place.city } };
}
