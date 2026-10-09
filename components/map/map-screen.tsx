"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
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
import { StandInMap } from "@/components/map/stand-in-map";
import type { CameraRequest, CameraTarget, CityEntry } from "@/components/map/surface";
import { PersonAvatar } from "@/components/photos/person-avatar";
import { TagList } from "@/components/tags/tag-editor";
import { buttonVariants } from "@/components/ui/button";
import { distanceKm, formatDistance, formatMetDate } from "@/lib/format";
import type { LatLng } from "@/lib/map/geo";
import { hasMapbox } from "@/lib/map/mapbox-style";
import { getMockPerson, mockCurrentLocation, mockLaterMeetings } from "@/lib/mock/people";
import type { Person } from "@/lib/types";
import { nextBirthday } from "@/lib/upcoming";
import { cn } from "@/lib/utils";

// The real map loads only when a public Mapbox token is set, and only on this
// screen: Mapbox GL is large.
const MapboxSurface = dynamic(() => import("@/components/map/mapbox-map"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[color-mix(in_oklch,var(--primary)_7%,var(--muted))]" />,
});

type Mode =
  | { kind: "cities" }
  | { kind: "city"; city: string }
  | { kind: "near"; radiusKm: number }
  | { kind: "trip"; city: string; from: string; to: string }
  | { kind: "person"; id: string; from: Mode };

const RADII = [1, 5, 25];

// Where "Near me" centres. Mockup: the sample position, so the sample people
// are nearby. Real build: the phone's location (lib/geo/locate.ts).
const HERE: LatLng = { lat: mockCurrentLocation.lat, lng: mockCurrentLocation.lng };

export function MapScreen({ people }: { people: Person[] }) {
  const [mode, setMode] = useState<Mode>({ kind: "cities" });

  const located = useMemo(
    () => people.filter((p): p is Person & LatLng => p.lat !== null && p.lng !== null),
    [people],
  );

  const cities = useMemo<CityEntry[]>(() => {
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

  const home = useMemo<CameraTarget>(() => ({ kind: "fit", points: located, minSpanDeg: 20 }), [located]);
  const [camera, setCamera] = useState<CameraRequest>(() => ({ id: 0, target: home }));
  const move = (target: CameraTarget) => setCamera((c) => ({ id: c.id + 1, target }));

  function showCities() {
    setMode({ kind: "cities" });
    move(home);
  }

  function flyToCity(city: string) {
    const entry = cities.find((c) => c.city === city);
    const pts = (entry?.people ?? []).filter((p): p is Person & LatLng => p.lat !== null && p.lng !== null);
    if (pts.length) move({ kind: "fit", points: pts, minSpanDeg: 0.25 });
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
    move({ kind: "near", center: HERE, radiusKm });
  }

  function showPerson(id: string) {
    setMode((m) => ({ kind: "person", id, from: m.kind === "person" ? m.from : m }));
  }

  const nearby = useMemo(() => {
    if (mode.kind !== "near") return [];
    return located
      .map((p) => ({ person: p, km: distanceKm(HERE.lat, HERE.lng, p.lat, p.lng) }))
      .filter((r) => r.km <= mode.radiusKm)
      .sort((a, b) => a.km - b.km);
  }, [located, mode]);

  const surface = {
    people: located,
    cities,
    selectedId: mode.kind === "person" ? mode.id : null,
    near: mode.kind === "near" ? { center: HERE, radiusKm: mode.radiusKm } : null,
    camera,
    onSelectPerson: showPerson,
    onSelectCity: showCity,
    onBackground: () => {
      if (mode.kind === "person") setMode(mode.from);
    },
  };

  return (
    <main className="fixed inset-x-0 top-6 bottom-(--tabbar-h) flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        {hasMapbox() ? <MapboxSurface {...surface} /> : <StandInMap {...surface} />}

        <div className="pointer-events-none absolute top-3 right-3 left-3 flex justify-between gap-2 pt-[env(safe-area-inset-top)]">
          <div className="pointer-events-auto flex gap-2">
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
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-touch" }),
              "pointer-events-auto rounded-full bg-background text-muted-foreground shadow-md",
            )}
          >
            <SettingsIcon />
          </Link>
        </div>
      </div>

      <section className="relative z-10 -mt-4 max-h-[46%] min-h-[32%] overflow-y-auto overscroll-contain rounded-t-3xl border-t bg-background px-5 pt-2 pb-3 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.15)]">
        <span className="mx-auto mb-2 block h-1 w-9 rounded-full bg-border" aria-hidden />
        {mode.kind === "cities" && <CityList cities={cities} onSelect={showCity} total={people.length} />}
        {mode.kind === "city" && (
          <CityPeople entry={cities.find((c) => c.city === mode.city)!} onBack={showCities} onSelect={showPerson} />
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
          <PersonCard person={people.find((p) => p.id === mode.id)!} onClose={() => setMode(mode.from)} />
        )}
      </section>
    </main>
  );
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
