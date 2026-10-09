"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { LatLng } from "@/lib/map/geo";
import { MAPBOX_TOKEN, mapConfig, mapStyle } from "@/lib/map/mapbox-style";

// The live map inside the pin mover. It exists only while the mover is open.
export default function PinMoverMapbox({ start, onMove }: { start: LatLng; onMove: (at: LatLng) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  useEffect(() => {
    if (!ref.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: mapStyle(),
      config: mapConfig(dark),
      center: [start.lng, start.lat],
      zoom: 16,
      pitch: 0,
      dragRotate: false,
      attributionControl: true,
    });
    map.touchZoomRotate.disableRotation();
    map.on("moveend", () => {
      const c = map.getCenter();
      onMoveRef.current({ lat: c.lat, lng: c.lng });
    });
    if (process.env.NODE_ENV !== "production") (window as unknown as { __kingPinMap?: mapboxgl.Map }).__kingPinMap = map;
    return () => map.remove();
    // The start position only seeds the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sized inline: Mapbox's stylesheet sets position on its container and
  // would override a utility class, leaving the map zero pixels tall.
  return <div ref={ref} style={{ position: "absolute", inset: 0 }} />;
}
