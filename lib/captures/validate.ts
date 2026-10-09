// Checks a voice-note upload before anything is stored or paid for: the
// audio's size and format, the duration the phone reports, and the stamp
// (when, where). The server never decodes the audio, so the duration is the
// device's word, held to the 90-second cap. Used by POST /api/captures.
import { z } from "zod";
import { MAX_SECONDS } from "@/lib/audio/recorder";

export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
// The recorder stops itself at 90 s; timers on a busy phone can run a little over.
export const MAX_DURATION_SECONDS = MAX_SECONDS + 5;
export const MIN_DURATION_SECONDS = 1;
// Notes can wait on the phone without signal for a while, but not forever.
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;

// Formats both the audio bucket and OpenAI transcription accept. Ogg is
// missing on purpose: transcription rejects it.
export const AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/mpeg", "audio/wav"] as const;
export type AudioType = (typeof AUDIO_TYPES)[number];

const optionalNumber = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().min(min).max(max).optional());

const Fields = z
  .object({
    id: z.uuid(),
    duration_seconds: z.coerce.number().refine(Number.isFinite),
    recorded_at: z.iso.datetime({ offset: true }),
    timezone: z.string().max(64).refine(isTimeZone).optional(),
    lat: optionalNumber(-90, 90),
    lng: optionalNumber(-180, 180),
    accuracy_m: optionalNumber(0, 100_000),
    // An Event Mode take: the event it belongs to.
    event_id: z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional()),
  })
  .refine((f) => (f.lat === undefined) === (f.lng === undefined), { message: "lat and lng go together" });

export type CaptureUpload = {
  id: string;
  mime: AudioType;
  bytes: number;
  durationSeconds: number;
  recordedAt: string;
  timezone: string | null;
  location: { lat: number; lng: number; accuracyM: number | null } | null;
  eventId: string | null;
};

export type UploadRejection = { status: 400 | 413 | 415; message: string };

export function validateCaptureUpload(
  file: { size: number; type: string } | null,
  fields: Record<string, unknown>,
  now = Date.now(),
): { ok: true; value: CaptureUpload } | { ok: false; error: UploadRejection } {
  const reject = (status: UploadRejection["status"], message: string) => ({ ok: false as const, error: { status, message } });

  if (!file || file.size === 0) return reject(400, "The recording is missing or empty.");
  if (file.size > MAX_AUDIO_BYTES) return reject(413, "The recording is larger than 10 MB.");
  const mime = file.type.split(";")[0].trim().toLowerCase();
  if (!(AUDIO_TYPES as readonly string[]).includes(mime)) return reject(415, `Recordings in ${mime || "this format"} can't be transcribed.`);

  const parsed = Fields.safeParse(fields);
  if (!parsed.success) return reject(400, "The recording's details are incomplete.");
  const f = parsed.data;

  if (f.duration_seconds < MIN_DURATION_SECONDS) return reject(400, "The recording is too short to transcribe.");
  if (f.duration_seconds > MAX_DURATION_SECONDS) return reject(400, "Recordings can be up to 90 seconds.");

  const recorded = Date.parse(f.recorded_at);
  if (recorded > now + CLOCK_SKEW_MS) return reject(400, "The recording's time is in the future.");
  if (recorded < now - MAX_AGE_MS) return reject(400, "The recording is more than 30 days old.");

  return {
    ok: true,
    value: {
      id: f.id,
      mime: mime as AudioType,
      bytes: file.size,
      durationSeconds: f.duration_seconds,
      recordedAt: new Date(recorded).toISOString(),
      timezone: f.timezone ?? null,
      location: f.lat !== undefined && f.lng !== undefined ? { lat: f.lat, lng: f.lng, accuracyM: f.accuracy_m ?? null } : null,
      eventId: f.event_id ?? null,
    },
  };
}

function isTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}
