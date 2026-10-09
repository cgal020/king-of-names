"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronDownIcon, MicIcon, SearchIcon, SparklesIcon, XIcon } from "lucide-react";
import { useAskStore } from "@/components/ask/ask-store";
import { ComingUp } from "@/components/coming-up";
import { PersonAvatar } from "@/components/photos/person-avatar";
import { buttonVariants } from "@/components/ui/button";
import { looksLikeQuestion } from "@/lib/ask/question";
import { firstLine, formatMetDate, formatMonthGroup } from "@/lib/format";
import { knownTags, relationshipLabel, type Relationship } from "@/lib/tags";
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
  const [type, setType] = useState("");
  const [tag, setTag] = useState("");
  const router = useRouter();
  const { setPending } = useAskStore();

  const isQuestion = looksLikeQuestion(query);

  // Questions are answered on the Ask tab.
  function askAi() {
    setPending(query.trim());
    router.push("/ask");
  }

  const cities = useMemo(() => uniqueSorted(people.map((p) => p.city)), [people]);
  const countries = useMemo(() => uniqueSorted(people.map((p) => p.country)), [people]);
  const tags = useMemo(() => knownTags(people).filter((t) => people.some((p) => p.tags.includes(t))), [people]);

  const results = useMemo(() => {
    const terms = fold(query).split(/\s+/).filter(Boolean);
    return people
      .filter((p) => {
        if (city && p.city !== city) return false;
        if (country && p.country !== country) return false;
        if (!matchesWhen(p.met_at, when)) return false;
        // "Both" counts as business and as personal.
        if (type && p.relationship !== type && p.relationship !== "both") return false;
        if (tag && !p.tags.includes(tag)) return false;
        const haystack = fold(
          [p.full_name, p.notes, p.where_met_text, p.place_name, p.city, ...p.tags].filter(Boolean).join(" "),
        );
        return terms.every((t) => haystack.includes(t));
      })
      .sort((a, b) => b.met_at.localeCompare(a.met_at));
  }, [people, query, city, country, when, type, tag]);

  const groups = useMemo(() => {
    const map = new Map<string, Person[]>();
    for (const p of results) {
      const key = formatMonthGroup(p.met_at);
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return [...map.entries()];
  }, [results]);

  const filtered = Boolean(query || city || country || when || type || tag);

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
            enterKeyHint={isQuestion ? "send" : "search"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isQuestion) {
                e.preventDefault();
                askAi();
              }
            }}
            placeholder="Search names, notes, places, tags"
            aria-label="Search people"
            className="h-12 w-full rounded-xl bg-muted pr-10 pl-10 text-[1.0625rem] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
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
          <FilterChip
            label="Type"
            allLabel="Business and personal"
            value={type}
            onChange={setType}
            options={["business", "personal"]}
            optionLabel={(v) => relationshipLabel(v as Relationship) ?? v}
          />
          <FilterChip label="Tag" allLabel="All tags" value={tag} onChange={setTag} options={tags} />
          <FilterChip label="City" allLabel="All cities" value={city} onChange={setCity} options={cities} />
          <FilterChip
            label="Country"
            allLabel="All countries"
            value={country}
            onChange={setCountry}
            options={countries}
          />
          <FilterChip
            label="Any time"
            allLabel="Any time"
            value={when}
            onChange={(v) => setWhen(v as When)}
            options={WHEN_OPTIONS.slice(1).map((o) => o.value)}
            optionLabel={(v) => WHEN_OPTIONS.find((o) => o.value === v)?.label ?? v}
          />
        </div>
      </div>

      {isQuestion && <AskRow question={query} onAsk={askAi} />}
      {!filtered && <ComingUp people={people} />}

      <p className="sr-only" aria-live="polite">
        {results.length} {results.length === 1 ? "person" : "people"}
      </p>

      {results.length > 0
        ? groups.map(([month, list]) => (
            <section key={month} className="mt-3">
              <h2 className="type-section pt-4 pb-1">{month}</h2>
              <ul className="divide-y">
                {list.map((p) => (
                  <li key={p.id}>
                    <PersonRow person={p} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        : // A question rarely matches as plain text; the Ask AI row is the answer.
          !isQuestion && (
            <div className="py-16 text-center">
              <p className="font-medium">No one matches{query ? ` \u201c${query}\u201d` : " these filters"}</p>
              <p className="mt-1 text-sm text-muted-foreground">Try part of a name, a company or a place.</p>
              {filtered && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCity("");
                    setCountry("");
                    setWhen("");
                    setType("");
                    setTag("");
                  }}
                  className="mt-4 h-11 rounded-xl px-4 text-[0.9375rem] font-semibold text-primary"
                >
                  Clear search and filters
                </button>
              )}
            </div>
          )}
    </>
  );
}

function AskRow({ question, onAsk }: { question: string; onAsk: () => void }) {
  return (
    <button
      type="button"
      onClick={onAsk}
      className="mt-2 flex min-h-14 w-full items-center gap-3 rounded-2xl bg-accent px-3.5 py-3 text-left text-accent-foreground transition-transform duration-120 active:scale-[0.98]"
    >
      <SparklesIcon className="size-5 shrink-0" aria-hidden />
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-semibold">Ask AI</span>
        <span className="block truncate text-sm text-muted-foreground">{question}</span>
      </span>
    </button>
  );
}

function PersonRow({ person: p }: { person: Person }) {
  const note = firstLine(p.notes);
  return (
    <Link
      href={`/people/${p.id}`}
      className="-mx-2 flex min-h-17 items-center gap-3 rounded-xl px-2 py-2.5 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:bg-muted"
    >
      <PersonAvatar personId={p.id} name={p.full_name} size={36} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          {/* The name always leads; it wraps rather than truncates at large text sizes. */}
          <bdi dir="auto" className="type-name-list line-clamp-2 min-w-0 flex-1">
            {p.full_name}
          </bdi>
          <span className="shrink-0 text-[0.8125rem] text-muted-foreground">{formatMetDate(p.met_at, p.met_timezone)}</span>
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {p.city && <span className="text-foreground">{p.city}</span>}
          {p.city && note && " \u00b7 "}
          {note}
        </span>
      </span>
    </Link>
  );
}

function FilterChip({
  label,
  allLabel,
  value,
  onChange,
  options,
  optionLabel = (v) => v,
}: {
  label: string;
  // The "no filter" option, e.g. "All cities".
  allLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  optionLabel?: (value: string) => string;
}) {
  const active = Boolean(value);
  return (
    <label
      className={cn(
        "relative flex h-9 shrink-0 items-center gap-1 rounded-full border px-3.5 text-[0.9375rem] transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        active ? "border-primary bg-accent font-medium text-accent-foreground" : "border-border text-foreground",
      )}
    >
      {active && <CheckIcon className="size-3.5" strokeWidth={2.5} aria-hidden />}
      {active ? optionLabel(value) : label}
      <ChevronDownIcon className="size-3.5" aria-hidden />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        <option value="">{allLabel}</option>
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
