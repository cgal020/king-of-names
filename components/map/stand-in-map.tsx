"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAvatar } from "@/components/photos/photo-store";
import type { CameraTarget, CityEntry, SurfaceProps } from "@/components/map/surface";
import { WORLD_LAND_PATH } from "@/lib/mock/world-path";
import { cn } from "@/lib/utils";

// The drawn map used until a Mapbox token is set. The view is a centre and a
// width in projected degrees (x = lng + 180, y = 90 - lat).

type View = { cx: number; cy: number; w: number };

const CLUSTER_ABOVE_WIDTH = 4;
const toX = (lng: number) => lng + 180;
const toY = (lat: number) => 90 - lat;

function fitView(points: { lat: number; lng: number }[], minWidth: number, aspect: number): View {
  const xs = points.map((p) => toX(p.lng));
  const ys = points.map((p) => toY(p.lat));
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const w = Math.max(minWidth, (maxX - minX) * 1.5, ((maxY - minY) * 1.5) / aspect);
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w };
}

function viewFor(target: CameraTarget, aspect: number): View {
  if (target.kind === "fit") return fitView(target.points, target.minSpanDeg, aspect);
  const dLat = (target.radiusKm / 111) * 1.25;
  return {
    cx: toX(target.center.lng),
    cy: toY(target.center.lat),
    w: Math.max(0.05, (dLat * 2) / Math.min(aspect, 1)),
  };
}

export function StandInMap({
  people,
  cities,
  selectedId,
  near,
  camera,
  onSelectPerson,
  onSelectCity,
  onBackground,
}: SurfaceProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 375, height: 420 });
  const aspect = size.height / size.width;
  const [view, setView] = useState<View>(() => viewFor(camera.target, 1.1));
  const animation = useRef<number | null>(null);

  // Mirrors `view` so an animation always starts from what is on screen.
  const viewRef = useRef(view);
  const applyView = useCallback((next: View) => {
    viewRef.current = next;
    setView(next);
  }, []);

  // The last camera request, re-applied when the map changes size.
  const targetRef = useRef(camera.target);

  // Measure the map so projected degrees map to real pixels.
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
      applyView(viewFor(targetRef.current, height / width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [applyView]);

  const flyTo = useCallback(
    (target: View) => {
      if (animation.current) cancelAnimationFrame(animation.current);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        applyView(target);
        return;
      }
      const start = viewRef.current;
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / 700);
        const e = 1 - Math.pow(1 - t, 4); // ease-out-quart
        applyView({
          cx: start.cx + (target.cx - start.cx) * e,
          cy: start.cy + (target.cy - start.cy) * e,
          // Interpolate zoom in log space so the flight feels even.
          w: Math.exp(Math.log(start.w) + (Math.log(target.w) - Math.log(start.w)) * e),
        });
        if (t < 1) animation.current = requestAnimationFrame(tick);
      };
      animation.current = requestAnimationFrame(tick);
    },
    [applyView],
  );

  // Each new camera request flies there.
  const lastCamera = useRef(camera.id);
  useEffect(() => {
    if (camera.id === lastCamera.current) return;
    lastCamera.current = camera.id;
    targetRef.current = camera.target;
    const el = mapRef.current;
    flyTo(viewFor(camera.target, el ? el.clientHeight / el.clientWidth : 1.1));
  }, [camera, flyTo]);

  const h = view.w * aspect;
  const project = (lat: number, lng: number) => ({
    left: ((toX(lng) - (view.cx - view.w / 2)) / view.w) * size.width,
    top: ((toY(lat) - (view.cy - h / 2)) / h) * size.height,
  });
  const clustered = view.w > CLUSTER_ABOVE_WIDTH;
  const clusters = clustered ? clusterCities(cities, project) : [];

  function openCluster(group: CityEntry[]) {
    if (group.length === 1) return onSelectCity(group[0].city);
    const pts = group.flatMap((c) => c.people).filter((p) => p.lat !== null && p.lng !== null);
    flyTo(fitView(pts as { lat: number; lng: number }[], 2, aspect));
  }

  return (
    <div
      ref={mapRef}
      className="absolute inset-0 touch-none overflow-hidden bg-[color-mix(in_oklch,var(--primary)_7%,var(--muted))]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onBackground();
      }}
    >
      <svg
        viewBox={`${view.cx - view.w / 2} ${view.cy - h / 2} ${view.w} ${h}`}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full"
        aria-hidden
      >
        <path d={WORLD_LAND_PATH} className="fill-card stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        {near && (
          <ellipse
            cx={toX(near.center.lng)}
            cy={toY(near.center.lat)}
            rx={near.radiusKm / (111 * Math.cos((near.center.lat * Math.PI) / 180))}
            ry={near.radiusKm / 111}
            className="fill-primary/10 stroke-primary/40"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Markers are HTML so they stay crisp and get proper tap targets. */}
      {clustered
        ? clusters.map((cl) => {
            const count = cl.cities.reduce((n, c) => n + c.people.length, 0);
            const dot = 28 + Math.min(count, 6) * 4;
            const name = cl.cities.length === 1 ? cl.cities[0].city : `${cl.cities[0].city} +${cl.cities.length - 1}`;
            return (
              <button
                key={cl.cities.map((c) => c.city).join("|")}
                type="button"
                onClick={() => openCluster(cl.cities)}
                aria-label={`${cl.cities.map((c) => c.city).join(", ")}: ${count} ${count === 1 ? "person" : "people"}`}
                className="absolute grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center"
                style={{ left: cl.left, top: cl.top }}
              >
                <span
                  className="grid place-items-center rounded-full border-2 border-background bg-primary text-sm font-semibold text-primary-foreground shadow-md transition-transform duration-150 active:scale-95"
                  style={{ width: dot, height: dot }}
                >
                  {count}
                </span>
                <span className="pointer-events-none absolute top-full -mt-1 rounded-md bg-background/85 px-1.5 text-xs font-medium whitespace-nowrap">
                  {name}
                </span>
              </button>
            );
          })
        : people.map((p) => {
            const selected = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPerson(p.id)}
                aria-label={p.full_name}
                aria-pressed={selected}
                className={cn("absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center", selected && "z-10")}
                style={project(p.lat, p.lng)}
              >
                <PinDot personId={p.id} selected={selected} />
                {selected && (
                  <span className="pointer-events-none absolute bottom-full -mb-1 rounded-md bg-foreground px-2 py-0.5 text-xs font-medium whitespace-nowrap text-background">
                    {p.full_name}
                  </span>
                )}
              </button>
            );
          })}

      {near && (
        <span
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-foreground shadow-md"
          style={project(near.center.lat, near.center.lng)}
          aria-hidden
        />
      )}

      <span className="pointer-events-none absolute bottom-6 left-3 rounded-md bg-background/80 px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">
        Sample map. The real map appears once a Mapbox key is set.
      </span>
    </div>
  );
}

// Merge cities whose bubbles would overlap on screen, like Mapbox clustering.
function clusterCities(cities: CityEntry[], project: (lat: number, lng: number) => { left: number; top: number }) {
  const clusters: { left: number; top: number; cities: CityEntry[] }[] = [];
  for (const c of cities) {
    if (!c.center) continue;
    const pos = project(c.center.lat, c.center.lng);
    const near = clusters.find((cl) => Math.hypot(cl.left - pos.left, cl.top - pos.top) < 52);
    if (near) near.cities.push(c);
    else clusters.push({ ...pos, cities: [c] });
  }
  return clusters;
}

// A photo pin when the person has a profile picture, otherwise a dot.
function PinDot({ personId, selected }: { personId: string; selected: boolean }) {
  const avatar = useAvatar(personId);
  if (avatar) {
    return (
      <span
        className={cn(
          "overflow-hidden rounded-full border-[3px] border-background bg-muted shadow-md transition-[width,height] duration-150",
          selected ? "size-10" : "size-8",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- object and signed URLs */}
        <img src={avatar.url} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full border-[3px] border-background bg-primary shadow-md transition-[width,height] duration-150",
        selected ? "size-6" : "size-4",
      )}
    />
  );
}
