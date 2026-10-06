"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, MicIcon, SearchIcon, XIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { firstLine, formatMetDate, formatMonthGroup } from "@/lib/format";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";

const WHEN_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "30d", label: "Last 30 days" },
  { value: "year", label: "This year" },
  { value: "lastYear", label: "Last year" },
  { value: "older", label: "Before that" },
] as const;

type When = (typeof WHEN_OPTIONS)[number]["value"];

// Case- and accent-insensitive, so "jose" finds "José".
function fold(text: string) {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

function matchesWhen(iso: string, when: When) {
  if (!when) return true;
  const date = new Date(iso);
  const now = new Date();
  const year = now.getFullYear();
  if (when === "30d") return now.getTime() - date.getTime() <= 30 * 86_400_000;
  if (when === "year") return date.getFullYear() === year;
  if (when === "lastYear") return date.getFullYear() === year - 1;
  return date.getFullYear() < year - 1;
}

export function PeopleList({ people }: { people: Person[] }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [when, setWhen] = useState<When>("");

  const cities = useMemo(() => uniqueSorted(people.map((p) => p.city)), [people]);
  const countries = useMemo(() => uniqueSorted(people.map((p) => p.country)), [people]);

  const results = useMemo(() => {
    const terms = fold(query).split(/\s+/).filter(Boolean);
    return people
      .filter((p) => {
        if (city && p.city !== city) return false;
        if (country && p.country !== country) return false;
        if (!matchesWhen(p.met_at, when)) return false;
        const haystack = fold(
          [p.full_name, p.notes, p.where_met_text, p.place_name, p.city].filter(Boolean).join(" "),
        );
        return terms.every((t) => haystack.includes(t));
      })
      .sort((a, b) => b.met_at.localeCompare(a.met_at));
  }, [people, query, city, country, when]);

  const groups = useMemo(() => {
    const map = new Map<string, Person[]>();
    for (const p of results) {
      const key = formatMonthGroup(p.met_at);
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return [...map.entries()];
  }, [results]);

  const filtered = Boolean(query || city || country || when);

  if (people.length === 0) return <EmptyState />;

  return (
    <>
      <div className="sticky top-0 z-10 -mx-5 bg-background/95 px-5 pt-1 pb-3 backdrop-blur-md">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search names, notes, places"
            aria-label="Search people"
            className="h-11 w-full rounded-xl bg-muted pr-10 pl-10 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
        <div className="mt-2.5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          <FilterChip label="City" value={city} onChange={setCity} options={cities} />
          <FilterChip label="Country" value={country} onChange={setCountry} options={countries} />
          <FilterChip
            label="Any time"
            value={when}
            onChange={(v) => setWhen(v as When)}
            options={WHEN_OPTIONS.slice(1).map((o) => o.value)}
            optionLabel={(v) => WHEN_OPTIONS.find((o) => o.value === v)?.label ?? v}
          />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {results.length} {results.length === 1 ? "person" : "people"}
      </p>

      {results.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-medium">No one matches{query ? ` “${query}”` : " these filters"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Try part of a name, a company or a place.</p>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCity("");
                setCountry("");
                setWhen("");
              }}
              className="mt-4 h-11 rounded-xl px-4 text-[0.95rem] font-medium text-primary"
            >
              Clear search and filters
            </button>
          )}
        </div>
      ) : (
        groups.map(([month, list]) => (
          <section key={month} className="mt-3">
            <h2 className="pt-3 pb-1 text-sm font-medium text-muted-foreground">{month}</h2>
            <ul className="divide-y">
              {list.map((p) => (
                <li key={p.id}>
                  <PersonRow person={p} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}

function PersonRow({ person: p }: { person: Person }) {
  const note = firstLine(p.notes);
  return (
    <Link href={`/people/${p.id}`} className="-mx-2 block rounded-xl px-2 py-3 transition-colors hover:bg-muted/60">
      <span className="flex items-baseline justify-between gap-3">
        <span className="truncate text-lg font-semibold tracking-tight">{p.full_name}</span>
        <span className="shrink-0 text-sm text-muted-foreground">{formatMetDate(p.met_at, p.met_timezone)}</span>
      </span>
      <span className="mt-0.5 block truncate text-[0.95rem] text-muted-foreground">
        {[p.city, note].filter(Boolean).join(" · ")}
      </span>
    </Link>
  );
}

function FilterChip({
  label,
  value,
  onChange,
  options,
  optionLabel = (v) => v,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  optionLabel?: (value: string) => string;
}) {
  const active = Boolean(value);
  return (
    <label
      className={cn(
        "relative flex h-9 shrink-0 items-center gap-1 rounded-full border px-3.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
      )}
    >
      {active ? optionLabel(value) : label}
      <ChevronDownIcon className="size-3.5" aria-hidden />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        <option value="">{label === "Any time" ? "Any time" : `All ${label.toLowerCase()}s`}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {optionLabel(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <p className="text-xl font-semibold tracking-tight">No one here yet</p>
      <p className="mt-2 max-w-[30ch] text-muted-foreground">
        Record a quick note the next time you meet someone. It takes five seconds.
      </p>
      <Link href="/capture" className={cn(buttonVariants({ size: "touch-lg" }), "mt-6")}>
        <MicIcon aria-hidden />
        Record your first note
      </Link>
    </div>
  );
}

function uniqueSorted(values: (string | null)[]) {
  return [...new Set(values.filter((v): v is string => Boolean(v)))].sort();
}
