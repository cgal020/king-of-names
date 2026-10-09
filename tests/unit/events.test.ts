import { describe, expect, it } from "vitest";
import { defaultEventName, isLive, openTakes, takeDetail, takeStatus, type EventSession, type Take } from "@/lib/events/event";
import { mockTakeDraft } from "@/lib/mock/events";

const meta = (i: number) => ({
  captureId: `c${i}`,
  recordedAt: "2026-10-09T17:10:00Z",
  timezone: "Asia/Dubai",
  durationSeconds: 6.4,
  location: { lat: 25.142, lng: 55.226, accuracyM: 14 },
  eventName: "Gallery night",
});
const take = (i: number, over: Partial<Take> = {}): Take => ({
  captureId: `c${i}`,
  recordedAt: "2026-10-09T17:10:00Z",
  durationSeconds: 6.4,
  draft: mockTakeDraft(i, meta(i)),
  readyAt: "2026-10-09T17:10:03Z",
  outcome: null,
  ...over,
});
const event = (takes: Take[], endedAt: string | null = null): EventSession => ({
  id: "e1",
  name: "Gallery night",
  startedAt: "2026-10-09T16:00:00Z",
  endedAt,
  takes,
});

describe("takeStatus", () => {
  const now = Date.parse("2026-10-09T17:10:02Z");
  it("follows a take from the phone to a decision", () => {
    expect(takeStatus(take(0, { readyAt: null }), now)).toBe("waiting");
    expect(takeStatus(take(0), now)).toBe("processing");
    expect(takeStatus(take(0), now + 5_000)).toBe("ready");
    expect(takeStatus(take(0, { outcome: "saved" }), now)).toBe("saved");
    expect(takeStatus(take(0, { outcome: "discarded", readyAt: null }), now)).toBe("discarded");
  });
});

describe("openTakes and isLive", () => {
  it("counts only takes without a decision", () => {
    const e = event([take(0, { outcome: "saved" }), take(1), take(2, { readyAt: null })]);
    expect(openTakes(e).map((t) => t.captureId)).toEqual(["c1", "c2"]);
    expect(openTakes(null)).toEqual([]);
  });

  it("is live until it ends", () => {
    expect(isLive(event([]))).toBe(true);
    expect(isLive(event([], "2026-10-09T20:00:00Z"))).toBe(false);
    expect(isLive(null)).toBe(false);
  });
});

describe("defaultEventName", () => {
  it("names the event after the day and part of day where it happens", () => {
    // 9 October 2026 is a Friday.
    expect(defaultEventName(new Date("2026-10-09T15:30:00Z"), "Asia/Dubai")).toBe("Friday evening");
    expect(defaultEventName(new Date("2026-10-09T03:00:00Z"), "Asia/Dubai")).toBe("Friday morning");
    expect(defaultEventName(new Date("2026-10-09T19:00:00Z"), "Asia/Dubai")).toBe("Friday night");
    // 00:30 on Saturday is still Friday night.
    expect(defaultEventName(new Date("2026-10-09T20:30:00Z"), "Asia/Dubai")).toBe("Friday night");
  });
});

describe("mock takes", () => {
  it("carry the take's own time, place and event", () => {
    const d = mockTakeDraft(1, meta(1));
    expect(d.captureId).toBe("c1");
    expect(d.person).toMatchObject({
      met_at: "2026-10-09T17:10:00Z",
      met_timezone: "Asia/Dubai",
      lat: 25.142,
      where_met_text: "Gallery night",
    });
    expect(takeDetail(d).length).toBeLessThanOrEqual(90);
  });

  it("leave the place empty when the take has no location", () => {
    const d = mockTakeDraft(0, { ...meta(0), location: null });
    expect(d.person).toMatchObject({ lat: null, place_name: null, city: null });
  });
});
