import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reverseGeocodeUrl } from "@/lib/geo/mapbox";
import { betterFix, failureReason, locateOnce, trackLocation, type Fix, type LocationStatus } from "@/lib/geo/locate";

// A stand-in for navigator.geolocation that the test drives by hand.
function fakeGeo() {
  let success: PositionCallback | null = null;
  let failure: PositionErrorCallback | null | undefined = null;
  const cleared: number[] = [];
  const geo = {
    watchPosition: vi.fn((ok: PositionCallback, err?: PositionErrorCallback | null) => {
      success = ok;
      failure = err;
      return 7;
    }),
    getCurrentPosition: vi.fn((ok: PositionCallback, err?: PositionErrorCallback | null, options?: PositionOptions) => {
      void options;
      success = ok;
      failure = err;
    }),
    clearWatch: vi.fn((id: number) => void cleared.push(id)),
  };
  return {
    geo,
    cleared,
    position(lat: number, lng: number, accuracy: number) {
      success?.({ coords: { latitude: lat, longitude: lng, accuracy }, timestamp: Date.parse("2026-10-08T09:00:00Z") } as GeolocationPosition);
    },
    error(code: number) {
      failure?.({ code } as GeolocationPositionError);
    },
  };
}

const fix = (accuracyM: number, at = "2026-10-08T09:00:00.000Z"): Fix => ({ lat: 25.08, lng: 55.14, accuracyM, at });

describe("betterFix and failureReason", () => {
  it("keeps the more accurate reading, and the newer one on a tie", () => {
    expect(betterFix(fix(120), fix(15))).toEqual(fix(15));
    expect(betterFix(fix(15), fix(120))).toEqual(fix(15));
    expect(betterFix(fix(15), fix(15, "2026-10-08T09:00:05.000Z")).at).toBe("2026-10-08T09:00:05.000Z");
    expect(betterFix(null, fix(40))).toEqual(fix(40));
  });

  it("treats only a refused permission as denied", () => {
    expect(failureReason({ code: 1 })).toBe("denied");
    expect(failureReason({ code: 2 })).toBe("unavailable");
    expect(failureReason({ code: 3 })).toBe("unavailable");
  });
});

describe("trackLocation", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports each improvement and settles on the most accurate fix", async () => {
    const gps = fakeGeo();
    const statuses: LocationStatus[] = [];
    const tracker = trackLocation((s) => statuses.push(s), gps.geo);
    gps.position(25.1, 55.1, 900.4);
    gps.position(25.0805, 55.1403, 60);
    gps.position(25.2, 55.2, 400);
    const result = await tracker.done();
    expect(statuses.map((s) => s.state)).toEqual(["locating", "found", "found", "found"]);
    expect(result).toMatchObject({ ok: true, fix: { lat: 25.0805, lng: 55.1403, accuracyM: 60 } });
    expect(gps.cleared).toEqual([7]);
  });

  it("stops watching once the fix is street-accurate, to save battery", () => {
    const gps = fakeGeo();
    trackLocation(() => {}, gps.geo);
    gps.position(25.08, 55.14, 12);
    expect(gps.cleared).toEqual([7]);
  });

  it("waits briefly for a first fix when the recording ends before one arrives", async () => {
    const gps = fakeGeo();
    const tracker = trackLocation(() => {}, gps.geo);
    const pending = tracker.done(3_000);
    await vi.advanceTimersByTimeAsync(1_000);
    gps.position(25.08, 55.14, 30);
    await expect(pending).resolves.toMatchObject({ ok: true, fix: { accuracyM: 30 } });
  });

  it("carries on without a location after the grace period", async () => {
    const gps = fakeGeo();
    const tracker = trackLocation(() => {}, gps.geo);
    const pending = tracker.done(3_000);
    await vi.advanceTimersByTimeAsync(3_000);
    await expect(pending).resolves.toEqual({ ok: false, reason: "unavailable" });
    expect(gps.cleared).toEqual([7]);
  });

  it("says when location is refused and doesn't wait for it", async () => {
    const gps = fakeGeo();
    const statuses: LocationStatus[] = [];
    const tracker = trackLocation((s) => statuses.push(s), gps.geo);
    gps.error(1);
    expect(statuses.at(-1)).toEqual({ state: "denied" });
    await expect(tracker.done()).resolves.toEqual({ ok: false, reason: "denied" });
  });

  it("keeps trying after a timeout, and shows the gap meanwhile", () => {
    const gps = fakeGeo();
    const statuses: LocationStatus[] = [];
    trackLocation((s) => statuses.push(s), gps.geo);
    gps.error(3);
    gps.position(25.08, 55.14, 50);
    expect(statuses.map((s) => s.state)).toEqual(["locating", "unavailable", "found"]);
    expect(gps.cleared).toEqual([]);
  });

  it("reports no location where the browser has none (plain HTTP)", async () => {
    const statuses: LocationStatus[] = [];
    const tracker = trackLocation((s) => statuses.push(s), null);
    expect(statuses).toEqual([{ state: "unavailable" }]);
    await expect(tracker.done()).resolves.toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("locateOnce", () => {
  it("returns one fix with whole-metre accuracy", async () => {
    const gps = fakeGeo();
    const pending = locateOnce(gps.geo);
    gps.position(25.08, 55.14, 17.6);
    await expect(pending).resolves.toEqual({
      ok: true,
      fix: { lat: 25.08, lng: 55.14, accuracyM: 18, at: "2026-10-08T09:00:00.000Z" },
    });
    expect(gps.geo.getCurrentPosition.mock.calls[0][2]).toMatchObject({ enableHighAccuracy: true, maximumAge: 60_000 });
  });

  it("returns the reason when it can't", async () => {
    const gps = fakeGeo();
    const pending = locateOnce(gps.geo);
    gps.error(1);
    await expect(pending).resolves.toEqual({ ok: false, reason: "denied" });
    await expect(locateOnce(null)).resolves.toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("reverseGeocodeUrl", () => {
  it("can ask for a display-only (temporary) lookup", () => {
    const url = new URL(reverseGeocodeUrl(25.08, 55.14, "tok", { permanent: false }));
    expect(url.searchParams.get("permanent")).toBe("false");
  });
});
