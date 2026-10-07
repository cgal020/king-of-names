import { describe, expect, it, vi } from "vitest";
import { normalizeExtraction } from "@/lib/ai/schema";
import { processCapture, type CaptureInput, type CapturePatch, type PipelineDeps } from "@/lib/pipeline/process-capture";
import { SAMPLES } from "../fixtures/extraction-samples";

const sample = SAMPLES[0];
const place = { place_name: "Dubai Marina", city: "Dubai", region: "Dubai", country: "United Arab Emirates", country_code: "AE" };

const input: CaptureInput = {
  captureId: "cap-1",
  audio: new Uint8Array([1, 2, 3]),
  mime: "audio/mp4",
  recordedAt: sample.recordedAt,
  timezone: sample.timezone,
  location: { lat: 25.08, lng: 55.14, accuracyM: 12 },
  keywords: ["Daniel Reyes"],
  knownTags: ["Logistics"],
};

function deps(overrides: Partial<PipelineDeps> = {}) {
  const saved: CapturePatch[] = [];
  const d: PipelineDeps = {
    transcribe: vi.fn(async () => sample.transcript),
    extract: vi.fn(async () => ({ raw: sample.modelOutput, clean: normalizeExtraction(sample.modelOutput) })),
    geocode: vi.fn(async () => place),
    saveCapture: vi.fn(async (_id, patch) => {
      saved.push(patch);
    }),
    ...overrides,
  };
  return { d, saved };
}

describe("processCapture", () => {
  it("transcribes, extracts and geocodes into a draft, saving each step", async () => {
    const { d, saved } = deps();
    const result = await processCapture(input, d);

    expect(result.status).toBe("extracted");
    expect(result.failedSteps).toEqual([]);
    expect(result.draft).toMatchObject({
      full_name: "Daniel Reyes",
      phone: "09175550142",
      met_at: sample.recordedAt,
      met_timezone: "Asia/Dubai",
      city: "Dubai",
      place_name: "Dubai Marina",
      lat: 25.08,
      tags: ["Logistics"],
    });
    expect(saved.map((p) => p.status)).toEqual(["transcribed", "extracted"]);
    expect(d.transcribe).toHaveBeenCalledWith(input.audio, "audio/mp4", ["Daniel Reyes"]);
    expect(d.extract).toHaveBeenCalledWith(expect.objectContaining({ knownTags: ["Logistics"], timezone: "Asia/Dubai" }));
  });

  it("skips geocoding when the phone had no location", async () => {
    const { d } = deps();
    const result = await processCapture({ ...input, location: null }, d);
    expect(d.geocode).not.toHaveBeenCalled();
    expect(result.draft.city).toBeNull();
    expect(result.status).toBe("extracted");
  });

  it("still returns a draft when geocoding fails", async () => {
    const { d, saved } = deps({ geocode: vi.fn(async () => Promise.reject(new Error("timeout"))) });
    const result = await processCapture(input, d);
    expect(result.status).toBe("extracted");
    expect(result.failedSteps).toEqual(["geocoding"]);
    expect(result.draft.full_name).toBe("Daniel Reyes");
    expect(saved.at(-1)?.error).toBe("Geocoding failed");
  });

  it("keeps the location and records the error when transcription fails", async () => {
    const { d, saved } = deps({ transcribe: vi.fn(async () => Promise.reject(new TypeError("network"))) });
    const result = await processCapture(input, d);
    expect(result.status).toBe("failed");
    expect(result.transcript).toBeNull();
    expect(d.extract).not.toHaveBeenCalled();
    expect(result.draft).toMatchObject({ lat: 25.08, city: "Dubai", full_name: "" });
    expect(saved).toEqual([{ status: "failed", geocode: place, error: "Transcription failed (TypeError)" }]);
  });

  it("returns the transcript so the user can finish by hand when extraction fails", async () => {
    const { d, saved } = deps({ extract: vi.fn(async () => Promise.reject(new Error("refused"))) });
    const result = await processCapture(input, d);
    expect(result.status).toBe("failed");
    expect(result.transcript).toBe(sample.transcript);
    expect(result.failedSteps).toEqual(["extraction"]);
    expect(saved.map((p) => p.status)).toEqual(["transcribed", "failed"]);
  });

  it("never stores note content in error text", async () => {
    const leaky = new Error(`Model said: ${sample.transcript}`);
    const { d, saved } = deps({ extract: vi.fn(async () => Promise.reject(leaky)) });
    await processCapture(input, d);
    expect(saved.at(-1)?.error).toBe("Extraction failed (Error)");
  });
});
