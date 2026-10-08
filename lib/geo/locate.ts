// Where the phone is right now, from the browser's Geolocation API. Photo
// EXIF can't be relied on (iPhone and Android strip GPS from web uploads), so
// every "where" stamp comes from here, taken at the moment of capture.

export type Fix = { lat: number; lng: number; accuracyM: number; at: string };
export type LocateFailure = "denied" | "unavailable";
export type LocateResult = { ok: true; fix: Fix } | { ok: false; reason: LocateFailure };
export type LocationStatus =
  | { state: "locating" }
  | { state: "found"; fix: Fix }
  | { state: "denied" }
  | { state: "unavailable" };

type Geo = Pick<Geolocation, "getCurrentPosition" | "watchPosition" | "clearWatch">;

// Good enough to stop looking: a street, not a district.
export const GOOD_ACCURACY_M = 25;

export function toFix(position: GeolocationPosition): Fix {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracyM: Math.round(position.coords.accuracy),
    at: new Date(position.timestamp).toISOString(),
  };
}

// Keeps the more accurate reading; on a tie, the newer one.
export function betterFix(current: Fix | null, next: Fix): Fix {
  if (!current) return next;
  return next.accuracyM <= current.accuracyM ? next : current;
}

export function failureReason(error: Pick<GeolocationPositionError, "code">): LocateFailure {
  // 1 is PERMISSION_DENIED; 2 (position unavailable) and 3 (timeout) may still recover.
  return error.code === 1 ? "denied" : "unavailable";
}

// Geolocation only works on HTTPS or localhost.
export function deviceGeolocation(): Geo | null {
  if (typeof window === "undefined" || !window.isSecureContext || !("geolocation" in navigator)) return null;
  return navigator.geolocation;
}

// One reading, for a photo just taken or a person added by hand. A reading
// from the last minute is reused, so a photo taken mid-recording gets the
// recording's fix without a second wait.
export function locateOnce(geo: Geo | null = deviceGeolocation(), timeoutMs = 8_000): Promise<LocateResult> {
  if (!geo) return Promise.resolve({ ok: false, reason: "unavailable" });
  return new Promise((resolve) => {
    geo.getCurrentPosition(
      (position) => resolve({ ok: true, fix: toFix(position) }),
      (error) => resolve({ ok: false, reason: failureReason(error) }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

// Watches the position while a note is recorded and keeps the most accurate
// reading. The first fix is often coarse (cell towers) and sharpens as GPS
// locks on, which a 10 to 90 second recording usually gives it time to do.
export function trackLocation(
  onStatus: (status: LocationStatus) => void,
  geo: Geo | null = deviceGeolocation(),
): { done: (graceMs?: number) => Promise<LocateResult>; cancel: () => void } {
  let best: Fix | null = null;
  let denied = false;
  let watchId: number | null = null;
  let waiting: ((result: LocateResult) => void) | null = null;

  const stop = () => {
    if (watchId !== null) geo?.clearWatch(watchId);
    watchId = null;
  };
  const settle = (result: LocateResult) => {
    stop();
    waiting?.(result);
    waiting = null;
  };

  if (!geo) {
    onStatus({ state: "unavailable" });
  } else {
    onStatus({ state: "locating" });
    watchId = geo.watchPosition(
      (position) => {
        best = betterFix(best, toFix(position));
        onStatus({ state: "found", fix: best });
        if (waiting) settle({ ok: true, fix: best });
        else if (best.accuracyM <= GOOD_ACCURACY_M) stop();
      },
      (error) => {
        const reason = failureReason(error);
        if (reason === "denied") {
          denied = true;
          onStatus({ state: "denied" });
          settle({ ok: false, reason });
        } else if (!best) {
          // A timeout: keep watching, but say so.
          onStatus({ state: "unavailable" });
        }
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return {
    // Ends the watch with the best reading so far. With none yet, waits up
    // to graceMs for a first one, then carries on without a location.
    done(graceMs = 3_000) {
      if (best) {
        stop();
        return Promise.resolve({ ok: true, fix: best });
      }
      if (denied || !geo) return Promise.resolve({ ok: false, reason: denied ? "denied" : "unavailable" });
      return new Promise((resolve) => {
        waiting = resolve;
        setTimeout(() => settle({ ok: false, reason: "unavailable" }), graceMs);
      });
    },
    cancel() {
      waiting = null;
      stop();
    },
  };
}
