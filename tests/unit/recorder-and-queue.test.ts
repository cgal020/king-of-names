import { describe, expect, it, vi } from "vitest";
import { pickMimeType } from "@/lib/audio/recorder";
import { flushQueue, memoryStore, type QueuedCapture } from "@/lib/offline/queue";

describe("pickMimeType", () => {
  it("prefers WebM/Opus where supported (Chrome, Android)", () => {
    expect(pickMimeType(() => true)).toBe("audio/webm;codecs=opus");
  });

  it("falls back to MP4 where only that records (iPhone Safari)", () => {
    expect(pickMimeType((t) => t.startsWith("audio/mp4"))).toBe("audio/mp4");
  });

  it("never picks Ogg", () => {
    expect(pickMimeType((t) => t.includes("ogg"))).toBeNull();
  });
});

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

describe("flushQueue", () => {
  it("sends waiting recordings oldest first and removes them", async () => {
    const store = memoryStore();
    await store.put(item("b", "2026-10-06T18:00:00Z"));
    await store.put(item("a", "2026-10-06T17:00:00Z"));
    const upload = vi.fn<(item: QueuedCapture) => Promise<void>>(async () => {});
    expect(await flushQueue(store, upload)).toEqual({ sent: 2, waiting: 0 });
    expect(upload.mock.calls.map(([i]) => i.id)).toEqual(["a", "b"]);
    expect(await store.all()).toEqual([]);
  });

  it("keeps a recording that fails, counts the attempt and stops", async () => {
    const store = memoryStore();
    await store.put(item("a", "2026-10-06T17:00:00Z"));
    await store.put(item("b", "2026-10-06T18:00:00Z"));
    const upload = vi.fn(async () => Promise.reject(new TypeError("Failed to fetch")));
    expect(await flushQueue(store, upload)).toEqual({ sent: 0, waiting: 2 });
    expect(upload).toHaveBeenCalledTimes(1);
    const kept = (await store.all()).find((i) => i.id === "a")!;
    expect(kept).toMatchObject({ attempts: 1, lastError: "TypeError" });
  });

  it("never uploads a recording twice when runs overlap", async () => {
    const store = memoryStore();
    await store.put(item("a", "2026-10-06T17:00:00Z"));
    const upload = vi.fn<(item: QueuedCapture) => Promise<void>>(() => new Promise((resolve) => setTimeout(resolve, 10)));
    const [first, second] = await Promise.all([flushQueue(store, upload), flushQueue(store, upload)]);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ sent: 1, waiting: 0 });
    expect(second).toEqual({ sent: 0, waiting: 0 });
  });

  it("still runs after an earlier run threw", async () => {
    const broken = { ...memoryStore(), all: vi.fn().mockRejectedValueOnce(new Error("IndexedDB closed")).mockResolvedValue([]) };
    await expect(flushQueue(broken, async () => {})).rejects.toThrow("IndexedDB closed");
    expect(await flushQueue(broken, async () => {})).toEqual({ sent: 0, waiting: 0 });
  });
});
