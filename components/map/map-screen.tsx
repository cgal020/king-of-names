"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BellIcon,
  CakeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LocateFixedIcon,
  PlaneIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react";
import { PersonAvatar } from "@/components/photos/person-avatar";
import { useAvatar } from "@/components/photos/photo-store";
import { TagList } from "@/components/tags/tag-editor";
import { buttonVariants } from "@/components/ui/button";
import { distanceKm, formatDistance, formatMetDate } from "@/lib/format";
import { getMockPerson, mockCurrentLocation, mockLaterMeetings } from "@/lib/mock/people";
import { WORLD_LAND_PATH } from "@/lib/mock/world-path";
import type { Person } from "@/lib/types";
import { nextBirthday } from "@/lib/upcoming";
import { cn } from "@/lib/utils";

// Mockup map. The view is a centre and width in projected degrees
// (x = lng + 180, y = 90 - lat). Milestone 7 swaps this for Mapbox GL with
// real clustering; the panel and its states carry over.

type View = { cx: number; cy: number; w: number };
type Mode =
  | { kind: "cities" }
  | { kind: "city"; city: string }
  | { kind: "near"; radiusKm: number }
  | { kind: "trip"; city: string; from: string; to: string }
  | { kind: "person"; id: string; from: Mode };

const RADII = [1, 5, 25];
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

export function MapScreen({ people }: { people: Person[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 375, height: 420 });
  const aspect = size.height / size.width;
  const [mode, setMode] = useState<Mode>({ kind: "cities" });

  const located = useMemo(
    () => people.filter((p): p is Person & { lat: number; lng: number } => p.lat !== null && p.lng !== null),
    [people],
  );

  const cities = useMemo(() => {
    const map = new Map<string, { city: string; country: string | null; people: Person[] }>();
    for (const p of people) {
      if (!p.city) continue;
      const entry = map.get(p.city) ?? { city: p.city, country: p.country, people: [] };
      entry.people.push(p);
      map.set(p.city, entry);
    }
    return [...map.values()]
      .map((c) => {
        const pts = c.people.filter((p) => p.lat !== null && p.lng !== null);
        const center = pts.length
          ? {
              lat: pts.reduce((s, p) => s + p.lat!, 0) / pts.length,
              lng: pts.reduce((s, p) => s + p.lng!, 0) / pts.length,
            }
          : null;
        return { ...c, center, people: c.people.sort((a, b) => b.met_at.localeCompare(a.met_at)) };
      })
      .sort((a, b) => b.people.length - a.people.length || a.city.localeCompare(b.city));
  }, [people]);

  const homeView = useCallback(() => fitView(located, 20, aspect), [located, aspect]);
  const [view, setView] = useState<View>(() => fitView(located, 20, 1.1));
  const animation = useRef<number | null>(null);

  // Mirrors `view` so an animation always starts from what is on screen.
  const viewRef = useRef(view);
  const applyView = useCallback((next: View) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Measure the map so projected degrees map to real pixels, and re-fit the
  // overview whenever the map changes size.
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
      if (modeRef.current.kind === "cities") applyView(fitView(located, 20, height / width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [applyView, located]);

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

  function showCities() {
    setMode({ kind: "cities" });
    flyTo(homeView());
  }

  function flyToCity(city: string) {
    const entry = cities.find((c) => c.city === city);
    const pts = entry?.people.filter((p) => p.lat !== null && p.lng !== null) as { lat: number; lng: number }[];
    if (pts?.length) flyTo(fitView(pts, 0.25, aspect));
  }

  function showCity(city: string) {
    setMode({ kind: "city", city });
    flyToCity(city);
  }

  // Trip mode: who you know in a city you're heading to.
  function showTrip(city: string, from: string, to: string) {
    setMode({ kind: "trip", city, from, to });
    flyToCity(city);
  }

  function startTrip() {
    const day = (offset: number) => {
      const d = new Date(Date.now() + offset * 86_400_000);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const city = cities.find((c) => c.city !== mockCurrentLocation.city)?.city ?? cities[0].city;
    showTrip(city, day(7), day(11));
  }

  function showNear(radiusKm: number) {
    setMode({ kind: "near", radiusKm });
    const dLat = (radiusKm / 111) * 1.25;
    flyTo({
      cx: toX(mockCurrentLocation.lng),
      cy: toY(mockCurrentLocation.lat),
      w: Math.max(0.05, (dLat * 2) / Math.min(aspect, 1)),
    });
  }

  function showPerson(id: string) {
    setMode((m) => ({ kind: "person", id, from: m.kind === "person" ? m.from : m }));
  }

  const h = view.w * aspect;
  const project = (lat: number, lng: number) => ({
    left: ((toX(lng) - (view.cx - view.w / 2)) / view.w) * size.width,
    top: ((toY(lat) - (view.cy - h / 2)) / h) * size.height,
  });
  const clustered = view.w > CLUSTER_ABOVE_WIDTH;
  const selectedId = mode.kind === "person" ? mode.id : null;

  const clusters = clustered ? clusterCities(cities, project) : [];

  function openCluster(group: CityEntry[]) {
    if (group.length === 1) return showCity(group[0].city);
    const pts = group.flatMap((c) => c.people).filter((p) => p.lat !== null && p.lng !== null);
    flyTo(fitView(pts as { lat: number; lng: number }[], 2, aspect));
  }

  const nearby = useMemo(() => {
    if (mode.kind !== "near") return [];
    return located
      .map((p) => ({ person: p, km: distanceKm(mockCurrentLocation.lat, mockCurrentLocation.lng, p.lat, p.lng) }))
      .filter((r) => r.km <= mode.radiusKm)
      .sort((a, b) => a.km - b.km);
  }, [located, mode]);

  return (
    <main className="fixed inset-x-0 top-6 bottom-(--tabbar-h) flex flex-col">
      <div
        ref={mapRef}
        className="relative flex-1 touch-none overflow-hidden bg-[color-mix(in_oklch,var(--primary)_7%,var(--muted))]"
        onClick={(e) => {
          if (e.target === e.currentTarget && mode.kind === "person") setMode(mode.from);
        }}
      >
        <svg
          viewBox={`${view.cx - view.w / 2} ${view.cy - h / 2} ${view.w} ${h}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 size-full"
          aria-hidden
        >
          <path
            d={WORLD_LAND_PATH}
            className="fill-card stroke-border"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {mode.kind === "near" && (
            <ellipse
              cx={toX(mockCurrentLocation.lng)}
              cy={toY(mockCurrentLocation.lat)}
              rx={mode.radiusKm / (111 * Math.cos((mockCurrentLocation.lat * Math.PI) / 180))}
              ry={mode.radiusKm / 111}
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
              const name =
                cl.cities.length === 1 ? cl.cities[0].city : `${cl.cities[0].city} +${cl.cities.length - 1}`;
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
          : located.map((p) => {
              const pos = project(p.lat, p.lng);
              const selected = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => showPerson(p.id)}
                  aria-label={p.full_name}
                  aria-pressed={selected}
                  className={cn(
                    "absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center",
                    selected && "z-10",
                  )}
                  style={pos}
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

        {mode.kind === "near" && (
          <span
            className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-foreground shadow-md"
            style={project(mockCurrentLocation.lat, mockCurrentLocation.lng)}
            aria-hidden
          />
        )}

        <div className="absolute top-3 right-3 left-3 flex justify-between gap-2 pt-[env(safe-area-inset-top)]">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => showNear(mode.kind === "near" ? mode.radiusKm : 5)}
              className={cn(
                "flex h-11 items-center gap-2 rounded-full bg-background px-4 text-[0.95rem] font-medium shadow-md transition-colors",
                mode.kind === "near" && "text-primary",
              )}
            >
              <LocateFixedIcon className="size-4.5" aria-hidden />
              Near me
            </button>
            <button
              type="button"
              onClick={startTrip}
              className={cn(
                "flex h-11 items-center gap-2 rounded-full bg-background px-4 text-[0.95rem] font-medium shadow-md transition-colors",
                mode.kind === "trip" && "text-primary",
              )}
            >
              <PlaneIcon className="size-4.5" aria-hidden />
              Trip
            </button>
          </div>
          <Link
            href="/settings"
            aria-label="Settings"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-touch" }), "rounded-full bg-background text-muted-foreground shadow-md")}
          >
            <SettingsIcon />
          </Link>
        </div>

        <span className="pointer-events-none absolute bottom-6 left-3 rounded-md bg-background/80 px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">
          Sample map. Real map arrives in milestone 7.
        </span>
      </div>

      <section className="relative z-10 -mt-4 max-h-[46%] min-h-[32%] overflow-y-auto overscroll-contain rounded-t-3xl border-t bg-background px-5 pt-2 pb-3 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.15)]">
        <span className="mx-auto mb-2 block h-1 w-9 rounded-full bg-border" aria-hidden />
        {mode.kind === "cities" && <CityList cities={cities} onSelect={showCity} total={people.length} />}
        {mode.kind === "city" && (
          <CityPeople
            entry={cities.find((c) => c.city === mode.city)!}
            onBack={showCities}
            onSelect={showPerson}
          />
        )}
        {mode.kind === "near" && (
          <NearMe radiusKm={mode.radiusKm} results={nearby} onRadius={showNear} onBack={showCities} />
        )}
        {mode.kind === "trip" && (
          <TripPanel
            city={mode.city}
            from={mode.from}
            to={mode.to}
            cities={cities}
            onChange={showTrip}
            onBack={showCities}
            onSelect={showPerson}
          />
        )}
        {mode.kind === "person" && (
          <PersonCard
            person={people.find((p) => p.id === mode.id)!}
            onClose={() => setMode(mode.from)}
          />
        )}
      </section>
    </main>
  );
}

// Merge cities whose bubbles would overlap on screen, like Mapbox clustering.
function clusterCities(
  cities: CityEntry[],
  project: (lat: number, lng: number) => { left: number; top: number },
) {
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

function PanelHeader({
  title,
  subtitle,
  onBack,
  backLabel = "All cities",
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <div className="mb-1">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex h-9 items-center gap-0.5 pr-2 text-sm font-medium text-primary"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          {backLabel}
        </button>
      )}
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}

type CityEntry = {
  city: string;
  country: string | null;
  people: Person[];
  center?: { lat: number; lng: number } | null;
};

function CityList({ cities, total, onSelect }: { cities: CityEntry[]; total: number; onSelect: (c: string) => void }) {
  return (
    <>
      <PanelHeader title="Cities" subtitle={`${total} people`} />
      <ul className="divide-y">
        {cities.map((c) => (
          <li key={c.city}>
            <button
              type="button"
              onClick={() => onSelect(c.city)}
              className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[1.0625rem] font-medium">{c.city}</span>
                <span className="block text-sm text-muted-foreground">{c.country}</span>
              </span>
              <span className="text-[0.95rem] font-medium tabular-nums">{c.people.length}</span>
              <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function CityPeople({
  entry,
  onBack,
  onSelect,
}: {
  entry: CityEntry;
  onBack: () => void;
  onSelect: (id: string) => void;
}) {
  const count = entry.people.length;
  return (
    <>
      <PanelHeader title={entry.city} subtitle={`${count} ${count === 1 ? "person" : "people"}`} onBack={onBack} />
      <ul className="divide-y">
        {entry.people.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <Link href={`/people/${p.id}`} className="min-w-0 flex-1 py-3">
              <span className="block truncate text-lg font-semibold tracking-tight">{p.full_name}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {[p.place_name, formatMetDate(p.met_at, p.met_timezone)].filter(Boolean).join(" · ")}
                {p.lat === null && " · no pin"}
              </span>
            </Link>
            {p.lat !== null && (
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                aria-label={`Show ${p.full_name} on the map`}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted"
              >
                <span className="size-3 rounded-full border-2 border-primary" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function TripPanel({
  city,
  from,
  to,
  cities,
  onChange,
  onBack,
  onSelect,
}: {
  city: string;
  from: string;
  to: string;
  cities: CityEntry[];
  onChange: (city: string, from: string, to: string) => void;
  onBack: () => void;
  onSelect: (id: string) => void;
}) {
  const entry = cities.find((c) => c.city === city);
  const people = entry?.people ?? [];
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T23:59:59`);
  const followUps = people.filter((p) => p.follow_up_note);
  const birthdays = people.filter((p) => {
    if (!p.birthday_month || !p.birthday_day) return false;
    const next = nextBirthday(p.birthday_month, p.birthday_day, start);
    return next !== null && next <= end;
  });
  // People recorded elsewhere whom you have also met in this city.
  const alsoMetHere = mockLaterMeetings
    .filter((m) => m.city === city && !people.some((p) => p.id === m.person_id))
    .map((m) => ({ meeting: m, person: getMockPerson(m.person_id)! }));
  const total = people.length + alsoMetHere.length;

  return (
    <>
      <PanelHeader title={`Trip to ${city}`} onBack={onBack} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <select
          aria-label="City"
          value={city}
          onChange={(e) => onChange(e.target.value, from, to)}
          className="col-span-2 h-11 rounded-xl border border-input bg-background px-3 text-base"
        >
          {cities.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city}, {c.country}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Arriving"
          value={from}
          onChange={(e) => e.target.value && onChange(city, e.target.value, e.target.value > to ? e.target.value : to)}
          className="h-11 rounded-xl border border-input bg-background px-3 text-base"
        />
        <input
          type="date"
          aria-label="Leaving"
          value={to}
          min={from}
          onChange={(e) => e.target.value && onChange(city, from, e.target.value)}
          className="h-11 rounded-xl border border-input bg-background px-3 text-base"
        />
      </div>

      <p className="mt-4 text-[1.0625rem] leading-relaxed text-pretty">
        You know {total === 1 ? "one person" : `${total} people`} in {city}.
        {followUps.length > 0 &&
          ` ${followUps.length === 1 ? "One follow-up is" : `${followUps.length} follow-ups are`} open.`}
        {birthdays.length > 0
          ? ` ${birthdays.map((p) => p.full_name.split(" ")[0]).join(" and ")} ${birthdays.length === 1 ? "has a birthday" : "have birthdays"} while you're there.`
          : " No birthdays while you're there."}
      </p>

      <ul className="mt-3 divide-y border-y">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <Link href={`/people/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3">
              <PersonAvatar personId={p.id} name={p.full_name} size={40} />
              <span className="min-w-0">
                <span className="block truncate text-[1.0625rem] font-semibold tracking-tight">{p.full_name}</span>
                <span className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                  {p.follow_up_note ? (
                    <>
                      <BellIcon className="size-3.5 shrink-0 text-primary" aria-hidden />
                      {p.follow_up_note}
                    </>
                  ) : birthdays.includes(p) ? (
                    <>
                      <CakeIcon className="size-3.5 shrink-0 text-primary" aria-hidden />
                      Birthday while you&rsquo;re there
                    </>
                  ) : (
                    [p.tags.join(", "), formatMetDate(p.met_at, p.met_timezone)].filter(Boolean).join(" · ")
                  )}
                </span>
              </span>
            </Link>
            {p.lat !== null && (
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                aria-label={`Show ${p.full_name} on the map`}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted"
              >
                <span className="size-3 rounded-full border-2 border-primary" />
              </button>
            )}
          </li>
        ))}
        {alsoMetHere.map(({ meeting, person: p }) => (
          <li key={meeting.id}>
            <Link href={`/people/${p.id}`} className="flex items-center gap-3 py-3">
              <PersonAvatar personId={p.id} name={p.full_name} size={40} />
              <span className="min-w-0">
                <span className="block truncate text-[1.0625rem] font-semibold tracking-tight">{p.full_name}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  Also met here {formatMetDate(meeting.met_at, meeting.met_timezone)} &middot; based in {p.city}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function NearMe({
  radiusKm,
  results,
  onRadius,
  onBack,
}: {
  radiusKm: number;
  results: { person: Person; km: number }[];
  onRadius: (km: number) => void;
  onBack: () => void;
}) {
  return (
    <>
      <PanelHeader title="Near you" subtitle={`Within ${radiusKm} km`} onBack={onBack} />
      <div role="radiogroup" aria-label="Distance" className="my-2 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {RADII.map((km) => (
          <button
            key={km}
            type="button"
            role="radio"
            aria-checked={km === radiusKm}
            onClick={() => onRadius(km)}
            className={cn(
              "h-9 rounded-lg text-sm font-medium transition-colors duration-150",
              km === radiusKm ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground",
            )}
          >
            {km} km
          </button>
        ))}
      </div>
      {results.length === 0 ? (
        <p className="py-6 text-center text-[0.95rem] text-muted-foreground">
          No one within {radiusKm} km. Try a wider circle.
        </p>
      ) : (
        <ul className="divide-y">
          {results.map(({ person: p, km }) => (
            <li key={p.id}>
              <Link href={`/people/${p.id}`} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-semibold tracking-tight">{p.full_name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {p.place_name} &middot; {formatMetDate(p.met_at, p.met_timezone)}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">{formatDistance(km)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
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

function PersonCard({ person: p, onClose }: { person: Person; onClose: () => void }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PersonAvatar personId={p.id} name={p.full_name} size={52} className="mt-1" />
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="text-2xl font-semibold tracking-tight">{p.full_name}</h1>
          <p className="mt-1 text-[0.95rem] text-muted-foreground">
            {[p.place_name, p.city].filter(Boolean).join(", ")} &middot; {formatMetDate(p.met_at, p.met_timezone)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-2 grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-muted"
        >
          <XIcon className="size-5" />
        </button>
      </div>
      <TagList relationship={p.relationship} tags={p.tags} className="mt-3" />
      {p.notes && <p className="mt-3 line-clamp-2 text-[0.95rem]">{p.notes}</p>}
      <Link href={`/people/${p.id}`} className={cn(buttonVariants({ size: "touch-lg" }), "mt-4 w-full")}>
        Open profile
      </Link>
    </div>
  );
}
