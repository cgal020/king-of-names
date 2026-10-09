import "server-only";
// Voice notes on the server: store the recording, run the pipeline, and
// rebuild the Review draft from what was saved, so a note can be reviewed
// later or on another visit. Row level security limits every query and the
// audio folder to the signed-in user. Never logs transcripts or names.
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractPerson } from "@/lib/ai/extract";
import { audioFileName, transcriptionKeywords } from "@/lib/ai/hints";
import { normalizeExtraction } from "@/lib/ai/schema";
import { transcribe } from "@/lib/ai/transcribe";
import type { Place } from "@/lib/geo/mapbox";
import { reverseGeocode } from "@/lib/geo/reverse-geocode";
import { buildDraft } from "@/lib/pipeline/draft";
import { processCapture, type CapturePatch, type CaptureStatus, type PipelineDeps } from "@/lib/pipeline/process-capture";
import { createClient } from "@/lib/supabase/server";
import { knownTags } from "@/lib/tags";
import type { Confidence, Draft, Person } from "@/lib/types";

export const CAPTURE_COLUMNS =
  "id, person_id, event_id, audio_path, audio_mime, duration_seconds, transcript, extraction, geocode, lat, lng, " +
  "location_accuracy_m, recorded_at, recorded_timezone, status, error, first_meeting, created_at";

export type CaptureRow = {
  id: string;
  person_id: string | null;
  event_id: string | null;
  audio_path: string | null;
  audio_mime: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  extraction: unknown;
  geocode: Place | null;
  lat: number | null;
  lng: number | null;
  location_accuracy_m: number | null;
  recorded_at: string | null;
  recorded_timezone: string | null;
  status: CaptureStatus;
  error: string | null;
  first_meeting: boolean;
  created_at: string;
};

// Notes waiting for a decision on Capture's "to review" strip.
export const OPEN_STATUSES: CaptureStatus[] = ["uploaded", "transcribed", "extracted", "failed"];

export function audioPath(userId: string, captureId: string, mime: string) {
  const ext = audioFileName(mime)?.split(".").pop() ?? "audio";
  return `${userId}/${captureId}.${ext}`;
}

export async function getCapture(supabase: SupabaseClient, id: string): Promise<CaptureRow | null> {
  const { data } = await supabase.from("captures").select(CAPTURE_COLUMNS).eq("id", id).maybeSingle();
  return (data as unknown as CaptureRow | null) ?? null;
}

// Which steps failed, read back from the saved row.
function failedSteps(row: CaptureRow): NonNullable<Draft["failedSteps"]> {
  const steps: NonNullable<Draft["failedSteps"]> = [];
  if (row.status === "failed" && !row.transcript) steps.push("transcription");
  else if (row.status === "failed") steps.push("extraction");
  if (row.lat !== null && !row.geocode && row.status !== "uploaded") steps.push("geocoding");
  return steps;
}

// The Review draft for a saved note.
export function draftFromRow(row: CaptureRow): Draft {
  const recordedAt = row.recorded_at ?? row.created_at;
  const clean = row.extraction ? normalizeExtraction(row.extraction, new Date(recordedAt)) : null;
  const location = row.lat !== null && row.lng !== null ? { lat: row.lat, lng: row.lng, accuracyM: row.location_accuracy_m } : null;
  return {
    captureId: row.id,
    person: buildDraft({ recordedAt, timezone: row.recorded_timezone, location }, clean, row.geocode),
    transcript: row.transcript,
    durationSeconds: row.duration_seconds,
    nameConfidence: (clean?.name_confidence as Confidence | undefined) ?? "high",
    additionalPeople: clean?.additional_people ?? [],
    failedSteps: failedSteps(row),
  };
}

// Runs transcription, extraction and the place lookup for a stored note.
// Each step is saved as it finishes, so a failure keeps what came before.
export async function processStoredCapture(
  supabase: SupabaseClient,
  row: CaptureRow,
  people: Person[],
  onStep?: PipelineDeps["onStep"],
) {
  if (!row.audio_path || !row.audio_mime) throw new Error("This note has no recording");
  const { data: blob, error } = await supabase.storage.from("audio").download(row.audio_path);
  if (error || !blob) throw new Error("The recording couldn't be read");

  const save = async (id: string, patch: CapturePatch) => {
    await supabase.from("captures").update(patch).eq("id", id);
  };
  return processCapture(
    {
      captureId: row.id,
      audio: new Uint8Array(await blob.arrayBuffer()),
      mime: row.audio_mime,
      recordedAt: row.recorded_at ?? row.created_at,
      timezone: row.recorded_timezone,
      location: row.lat !== null && row.lng !== null ? { lat: row.lat, lng: row.lng, accuracyM: row.location_accuracy_m } : null,
      keywords: transcriptionKeywords(people),
      knownTags: knownTags(people),
    },
    {
      transcribe,
      extract: extractPerson,
      geocode: (lat, lng) => reverseGeocode(lat, lng),
      saveCapture: save,
      onStep,
    },
  );
}

// A short-lived link to play a stored recording on Review or a profile.
export async function audioUrl(supabase: SupabaseClient, path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("audio").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

// A note as Review needs it. A note sent later from the phone's queue hasn't
// been processed yet, so that happens here, while Review's loading screen shows.
export type ReviewNote = { draft: Draft; audioUrl: string | null; done: boolean };

export async function loadNoteForReview(id: string, people: Person[]): Promise<ReviewNote | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const supabase = await createClient();
  let row = await getCapture(supabase, id);
  if (!row) return null;
  if (row.status === "uploaded" || row.status === "transcribed") {
    try {
      await processStoredCapture(supabase, row, people);
    } catch {
      console.error("capture processing failed", { captureId: id });
    }
    row = (await getCapture(supabase, id)) ?? row;
  }
  return {
    draft: draftFromRow(row),
    audioUrl: await audioUrl(supabase, row.audio_path),
    done: row.status === "confirmed" || row.status === "discarded",
  };
}
