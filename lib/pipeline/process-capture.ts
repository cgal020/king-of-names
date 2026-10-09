// The capture pipeline: audio in, review draft out. Each step saves its result
// as it goes, so a failure keeps everything before it. Providers and storage
// are passed in, which keeps this free of browser and framework code: the
// /api/captures route and the future WhatsApp intake both call it.
import type { ExtractionContext } from "@/lib/ai/prompt";
import type { CleanExtraction } from "@/lib/ai/schema";
import type { Place } from "@/lib/geo/mapbox";
import { buildDraft, type CaptureMeta, type PersonDraft } from "@/lib/pipeline/draft";

export type CaptureStatus = "uploaded" | "transcribed" | "extracted" | "confirmed" | "failed" | "discarded";

export type CapturePatch = {
  status?: CaptureStatus;
  transcript?: string;
  extraction?: unknown;
  geocode?: Place | null;
  error?: string | null;
};

export type PipelineDeps = {
  transcribe: (audio: Uint8Array, mime: string, keywords: string[]) => Promise<string>;
  extract: (context: ExtractionContext) => Promise<{ raw: unknown; clean: CleanExtraction }>;
  geocode: (lat: number, lng: number) => Promise<Place | null>;
  saveCapture: (captureId: string, patch: CapturePatch) => Promise<void>;
  // Told as each step finishes, so Capture can show real progress.
  onStep?: (step: PipelineStep, ok: boolean) => void;
};

export type PipelineStep = "transcription" | "extraction" | "geocoding";

export type CaptureInput = CaptureMeta & {
  captureId: string;
  audio: Uint8Array;
  mime: string;
  keywords: string[];
  knownTags: string[];
};

export type PipelineResult = {
  status: CaptureStatus;
  transcript: string | null;
  nameConfidence: CleanExtraction["name_confidence"] | null;
  additionalPeople: string[];
  draft: PersonDraft;
  // Which steps failed, for the review screen. Never contains note content.
  failedSteps: ("transcription" | "extraction" | "geocoding")[];
};

// Error text safe to store and show: the step and a short reason, never content.
function reason(step: string, error: unknown) {
  const message = error instanceof Error ? error.name : "Error";
  return `${step} failed (${message})`;
}

export async function processCapture(input: CaptureInput, deps: PipelineDeps): Promise<PipelineResult> {
  const failedSteps: PipelineResult["failedSteps"] = [];

  // Geocoding doesn't depend on the audio, so it runs alongside transcription.
  const told = (step: PipelineStep, ok: boolean) => {
    try {
      deps.onStep?.(step, ok);
    } catch {
      // Progress is a nicety; it never stops the pipeline.
    }
  };
  const placePromise: Promise<Place | null> = input.location
    ? deps.geocode(input.location.lat, input.location.lng).then(
        (place) => {
          told("geocoding", true);
          return place;
        },
        () => {
          failedSteps.push("geocoding");
          told("geocoding", false);
          return null;
        },
      )
    : Promise.resolve(null);

  let transcript: string;
  try {
    transcript = await deps.transcribe(input.audio, input.mime, input.keywords);
  } catch (error) {
    told("transcription", false);
    const place = await placePromise;
    failedSteps.push("transcription");
    await deps.saveCapture(input.captureId, { status: "failed", geocode: place, error: reason("Transcription", error) });
    return { status: "failed", transcript: null, nameConfidence: null, additionalPeople: [], draft: buildDraft(input, null, place), failedSteps };
  }
  await deps.saveCapture(input.captureId, { status: "transcribed", transcript });
  told("transcription", true);

  let extraction: { raw: unknown; clean: CleanExtraction } | null = null;
  try {
    extraction = await deps.extract({
      transcript,
      recordedAt: input.recordedAt,
      timezone: input.timezone,
      knownTags: input.knownTags,
    });
  } catch (error) {
    failedSteps.push("extraction");
    told("extraction", false);
    const place = await placePromise;
    await deps.saveCapture(input.captureId, { status: "failed", geocode: place, error: reason("Extraction", error) });
    // The transcript still goes back so the user can finish by hand.
    return { status: "failed", transcript, nameConfidence: null, additionalPeople: [], draft: buildDraft(input, null, place), failedSteps };
  }

  told("extraction", true);
  const place = await placePromise;
  await deps.saveCapture(input.captureId, {
    status: "extracted",
    extraction: extraction.raw,
    geocode: place,
    error: failedSteps.length ? "Geocoding failed" : null,
  });

  return {
    status: "extracted",
    transcript,
    nameConfidence: extraction.clean.name_confidence,
    additionalPeople: extraction.clean.additional_people,
    draft: buildDraft(input, extraction.clean, place),
    failedSteps,
  };
}
