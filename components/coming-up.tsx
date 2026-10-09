"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { BellIcon, CakeIcon } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import type { Person } from "@/lib/types";
import { upcoming, whenLabel } from "@/lib/upcoming";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};
// Today's date, read on the client only so a page built yesterday still shows today's list.
const todayKey = () => new Date().toDateString();

export function ComingUp({ people }: { people: Person[] }) {
  const key = useSyncExternalStore(noSubscribe, todayKey, () => null);
  const [showAll, setShowAll] = useState(false);
  if (!key) return null;

  const items = upcoming(people, new Date(key));
  if (items.length === 0) return null;
  const shown = showAll ? items : items.slice(0, 3);

  return (
    <section aria-labelledby="coming-up" className="mt-2 mb-2 rounded-3xl bg-card px-4 pt-3.5 pb-1 shadow-card">
      <div className="flex items-center justify-between">
        <h2 id="coming-up" className="type-section">
          Coming up
        </h2>
        {items.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="h-9 px-1 text-sm font-semibold text-primary"
          >
            {showAll ? "Show less" : `All ${items.length}`}
          </button>
        )}
      </div>
      <ul className="divide-y divide-border/70">
        {shown.map((item) => {
          const Icon = item.kind === "birthday" ? CakeIcon : BellIcon;
          const detail =
            item.kind === "birthday"
              ? `Birthday · ${formatShortDate(item.date)}`
              : `Follow up${item.person.follow_up_note ? ` · ${item.person.follow_up_note}` : ""}`;
          return (
            <li key={`${item.person.id}-${item.kind}`}>
              <Link href={`/people/${item.person.id}`} className="flex items-center gap-3 py-2.5">
                <Icon className="size-4.5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <bdi dir="auto" className="block truncate font-serif text-xl leading-[1.4]">{item.person.full_name}</bdi>
                  <span className="block truncate text-sm text-muted-foreground">{detail}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-sm tabular-nums",
                    item.inDays < 0 ? "font-medium text-destructive" : "text-muted-foreground",
                  )}
                >
                  {whenLabel(item.inDays)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
