"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { distanceKm } from "@/lib/format";
import type { Fix } from "@/lib/geo/locate";

// A fix this far from the last one looked up gets a fresh place name.
const MOVED_KM = 0.15;

// The place name for the live location chip, looked up once per fix and
// again only if the fix moves noticeably as GPS sharpens.
export function usePlaceName(fix: Fix | null) {
  const [placeName, setPlaceName] = useState<string | null>(null);
  const lookedUp = useRef<Fix | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!fix) return;
    const last = lookedUp.current;
    if (last && distanceKm(last.lat, last.lng, fix.lat, fix.lng) < MOVED_KM) return;
    lookedUp.current = fix;
    fetch("/api/geocode", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lat: fix.lat, lng: fix.lng }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((json: { place?: { placeName: string | null; city: string | null } | null } | null) => {
        const place = json?.place;
        if (alive.current && place) setPlaceName(place.placeName ?? place.city);
      })
      .catch(() => {
        // Offline or no geocoder: the chip shows the accuracy alone.
      });
  }, [fix]);

  const reset = useCallback(() => {
    lookedUp.current = null;
    setPlaceName(null);
  }, []);

  return { placeName, reset };
}
