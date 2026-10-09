"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { LatLng } from "@/lib/map/geo";
import { hasMapbox } from "@/lib/map/mapbox-style";
import { WORLD_LAND_PATH } from "@/lib/mock/world-path";

// A live map only while someone is moving a pin, so it's a billed load only then.
const MapboxPicker = dynamic(() => import("@/components/map/pin-mover-mapbox"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-muted" />,
});

// Fixes a wrong or rough GPS position: the pin stays in the middle and the
// map moves under it, which is easier on a phone than dragging a small pin.
export function PinMover({ start, onDone, onCancel }: { start: LatLng; onDone: (at: LatLng) => void; onCancel: () => void }) {
  const [at, setAt] = useState(start);
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-mover-title"
        className="flex max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-background sm:max-w-md sm:rounded-3xl"
      >
        <div className="px-5 pt-5 pb-3">
          <h2 id="pin-mover-title" className="text-2xl font-semibold tracking-tight">
            Move the pin
          </h2>
          <p className="mt-1 text-[0.95rem] text-muted-foreground">Drag the map until the pin sits where you met.</p>
        </div>
        <div className="relative h-[55dvh] min-h-64 overflow-hidden">
          {hasMapbox() ? <MapboxPicker start={start} onMove={setAt} /> : <DrawnPicker start={start} onMove={setAt} />}
          {/* The pin itself never moves; its point is at the centre of the map. */}
          <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full" aria-hidden>
            <span className="block size-6 rounded-full border-[3px] border-background bg-primary shadow-lg" />
            <span className="mx-auto block h-3 w-0.5 bg-primary" />
          </span>
        </div>
        <div className="flex gap-2 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" size="touch-lg" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="touch-lg" className="flex-[2]" onClick={() => onDone(at)}>
            Use this spot
          </Button>
        </div>
      </div>
    </div>
  );
}

// Width of the drawn view in degrees, about 4 km across.
const SPAN = 0.04;

// The drawn stand-in: a faint grid that pans with a finger or the arrow keys.
function DrawnPicker({ start, onMove }: { start: LatLng; onMove: (at: LatLng) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState(start);
  const drag = useRef<{ x: number; y: number; from: LatLng } | null>(null);
  const [size, setSize] = useState({ width: 360, height: 400 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize(entry.contentRect));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const moveTo = (next: LatLng) => {
    setCenter(next);
    onMove(next);
  };
  const spanY = (SPAN * size.height) / size.width;

  const x = center.lng + 180;
  const y = 90 - center.lat;
  return (
    <div
      ref={ref}
      tabIndex={0}
      aria-label="Map. Drag, or use the arrow keys, to move it under the pin."
      className="absolute inset-0 cursor-grab touch-none bg-[color-mix(in_oklch,var(--primary)_7%,var(--muted))] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset active:cursor-grabbing"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, from: center };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        moveTo({
          lng: d.from.lng - ((e.clientX - d.x) / size.width) * SPAN,
          lat: d.from.lat + ((e.clientY - d.y) / size.height) * spanY,
        });
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={(e) => {
        const step = SPAN / 20;
        const delta: Record<string, [number, number]> = {
          ArrowUp: [step, 0],
          ArrowDown: [-step, 0],
          ArrowLeft: [0, -step],
          ArrowRight: [0, step],
        };
        const d = delta[e.key];
        if (!d) return;
        e.preventDefault();
        moveTo({ lat: center.lat + d[0], lng: center.lng + d[1] });
      }}
    >
      <svg
        viewBox={`${x - SPAN / 2} ${y - spanY / 2} ${SPAN} ${spanY}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full"
        aria-hidden
      >
        <defs>
          <pattern id="pin-grid" width={SPAN / 8} height={SPAN / 8} patternUnits="userSpaceOnUse" x={0} y={0}>
            <path d={`M ${SPAN / 8} 0 L 0 0 0 ${SPAN / 8}`} className="fill-none stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </pattern>
        </defs>
        <path d={WORLD_LAND_PATH} className="fill-card" />
        <rect x={x - 1} y={y - 1} width={2} height={2} fill="url(#pin-grid)" />
      </svg>
      <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/80 px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">
        Sample map. The real map appears once a Mapbox key is set.
      </span>
    </div>
  );
}
