import { describe, expect, it, vi } from "vitest";
import { checkRateLimit, describeWait, rateLimitWindowStart } from "@/lib/captures/rate-limit";
import { MAX_AUDIO_BYTES, validateCaptureUpload } from "@/lib/captures/validate";
import { classifyUploadStatus, flushQueue, memoryStore, UploadRejected, type QueuedCapture } from "@/lib/offline/queue";

const NOW = Date.parse("2026-10-08T12:00:00Z");
const audio = (type = "audio/webm;codecs=opus", size = 180_000) => ({ type, size });
const fields = (over: Record<string, unknown> = {}) => ({
  id: "6f1c2a7e-3b9d-4e5f-8a1b-2c3d4e5f6a7b",
  duration_seconds: "24.6",
  recorded_at: "2026-10-08T11:58:00+04:00",
  timezone: "Asia/Dubai",
  lat: "25.0805",
  lng: "55.1403",
  accuracy_m: "15",
  ...over,
});

describe("validateCaptureUpload", () => {
  it("accepts a normal note and reads its stamp", () => {
    const result = validateCaptureUpload(audio(), fields({ recorded_at: "2026-10-08T11:58:00Z" }), NOW);
    expect(result).toEqual({
      ok: true,
      value: {
        id: "6f1c2a7e-3b9d-4e5f-8a1b-2c3d4e5f6a7b",
        mime: "audio/webm",
        bytes: 180_000,
        durationSeconds: 24.6,
        recordedAt: "2026-10-08T11:58:00.000Z",
        timezone: "Asia/Dubai",
        location: { lat: 25.0805, lng: 55.1403, accuracyM: 15 },
      },
    });
  });

  it("accepts iPhone's MP4 audio and a note with no location", () => {
    const result = validateCaptureUpload(
      audio("audio/mp4"),
      fields({ lat: "", lng: "", accuracy_m: "", recorded_at: "2026-10-08T11:00:00Z" }),
      NOW,
    );
    expect(result).toMatchObject({ ok: true, value: { mime: "audio/mp4", location: null } });
  });

  it.each([
    ["a missing file", null, fields(), 400],
    ["an empty file", audio("audio/webm", 0), fields(), 400],
    ["a file over 10 MB", audio("audio/webm", MAX_AUDIO_BYTES + 1), fields(), 413],
    ["Ogg audio, which transcription can't read", audio("audio/ogg"), fields(), 415],
    ["a video file", audio("video/mp4"), fields(), 415],
    ["a recording over 90 seconds", audio(), fields({ duration_seconds: "120" }), 400],
    ["a recording under a second", audio(), fields({ duration_seconds: "0.4" }), 400],
    ["a time in the future", audio(), fields({ recorded_at: "2026-10-08T13:00:00Z" }), 400],
    ["a note more than 30 days old", audio(), fields({ recorded_at: "2026-08-01T12:00:00Z" }), 400],
    ["a made-up time zone", audio(), fields({ timezone: "Mars/Olympus" }), 400],
    ["latitude without longitude", audio(), fields({ lng: "" }), 400],
    ["coordinates off the globe", audio(), fields({ lat: "91" }), 400],
    ["an id that isn't a UUID", audio(), fields({ id: "draft-1" }), 400],
  ])("rejects %s", (_label, file, f, status) => {
    const result = validateCaptureUpload(file, f, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(status);
      expect(result.error.message).toMatch(/\.$/);
    }
  });
});

describe("checkRateLimit", () => {
  it("allows up to 60 notes an hour", () => {
    expect(checkRateLimit({ countInWindow: 59, oldestInWindow: null, now: NOW })).toEqual({ allowed: true });
  });

  it("says when the next note is allowed once the hour is full", () => {
    const oldest = new Date(NOW - 50 * 60 * 1000);
    expect(checkRateLimit({ countInWindow: 60, oldestInWindow: oldest, now: NOW })).toEqual({
      allowed: false,
      retryAfterSeconds: 600,
    });
  });

  it("says roughly how long a held note waits", () => {
    expect(describeWait(20)).toBe("a few seconds");
    expect(describeWait(70)).toBe("about a minute");
    expect(describeWait(600)).toBe("about 10 minutes");
    expect(describeWait(3590)).toBe("about an hour");
  });

  it("counts from one hour ago", () => {
    expect(rateLimitWindowStart(NOW)).toBe("2026-10-08T11:00:00.000Z");
  });
});

describe("refused uploads in the offline queue", () => {
  const item = (id: string, recordedAt: string): QueuedCapture => ({
    id,
    audio: new Blob([new Uint8Array(4)], { type: "audio/mp4" }),
    mime: "audio/mp4",
    durationSeconds: 12,
    recordedAt,
    timezone: "Asia/Dubai",
    location: null,
    attempts: 0,
    lastError: null,
  });

  it("classifies the server's answers", () => {
    expect(classifyUploadStatus(201)).toBe("sent");
    expect(classifyUploadStatus(409)).toBe("rejected");
    expect(classifyUploadStatus(413)).toBe("rejected");
    expect(classifyUploadStatus(429)).toBe("retry");
    expect(classifyUploadStatus(503)).toBe("retry");
  });

  it("leaves a note alone while its first upload is under way, and retries it if the app closed mid-send", async () => {
    const store = memoryStore();
    const now = Date.parse("2026-10-09T10:00:00Z");
    await store.put({ ...item("a", "2026-10-09T09:59:00Z"), sendingUntil: "2026-10-09T10:00:20Z" });
    const upload = vi.fn<(i: QueuedCapture) => Promise<void>>(async () => {});
    expect(await flushQueue(store, upload, now)).toEqual({ sent: 0, waiting: 0, rejected: 0 });
    expect(upload).not.toHaveBeenCalled();
    // Reopened later: the send window has passed, so it goes now.
    expect(await flushQueue(store, upload, now + 60_000)).toEqual({ sent: 1, waiting: 0, rejected: 0 });
    expect(await store.all()).toEqual([]);
  });

  it("keeps a refused note, marks it, and still sends the ones after it", async () => {
    const store = memoryStore();
    await store.put(item("a", "2026-10-08T09:00:00Z"));
    await store.put(item("b", "2026-10-08T10:00:00Z"));
    const upload = vi.fn<(i: QueuedCapture) => Promise<void>>(async (i) => {
      if (i.id === "a") throw new UploadRejected("The recording is larger than 10 MB.");
    });
    expect(await flushQueue(store, upload)).toEqual({ sent: 1, waiting: 0, rejected: 1 });
    expect(await store.all()).toEqual([
      expect.objectContaining({ id: "a", rejected: "The recording is larger than 10 MB.", attempts: 1 }),
    ]);

    // Refused notes aren't retried on the next run.
    upload.mockClear();
    expect(await flushQueue(store, upload)).toEqual({ sent: 0, waiting: 0, rejected: 1 });
    expect(upload).not.toHaveBeenCalled();
  });
});
