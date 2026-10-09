"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CakeIcon, CheckIcon } from "lucide-react";
import { useFollowUpActions } from "@/components/follow-up-actions";
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
  // Follow-ups just marked done, hidden until the list reloads.
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const { done } = useFollowUpActions((id, gone) =>
    setHidden((h) => {
      const next = new Set(h);
      if (gone) next.add(id);
      else next.delete(id);
      return next;
    }),
  );
  if (!key) return null;

  const items = upcoming(people, new Date(key)).filter((i) => i.kind === "birthday" || !hidden.has(i.person.id));
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
          const detail =
            item.kind === "birthday"
              ? `Birthday · ${formatShortDate(item.date)}`
              : `Follow up${item.person.follow_up_note ? ` · ${item.person.follow_up_note}` : ""}`;
          return (
            <li key={`${item.person.id}-${item.kind}`} className="flex items-center gap-3">
              {item.kind === "birthday" ? (
                <CakeIcon className="size-4.5 shrink-0 text-primary" aria-hidden />
              ) : (
                // A follow-up is a to-do: tick it off here.
                <button
                  type="button"
                  aria-label={`Mark the follow-up with ${item.person.full_name} done`}
                  onClick={() => void done(item.person)}
                  className="group/tick -m-2 grid size-9 shrink-0 place-items-center rounded-full"
                >
                  <span className="grid size-5 place-items-center rounded-full border-2 border-primary text-primary transition-colors group-hover/tick:bg-primary/10 group-active/tick:bg-primary group-active/tick:text-primary-foreground">
                    <CheckIcon className="size-3 opacity-0 group-hover/tick:opacity-100 group-active/tick:opacity-100" strokeWidth={3} />
                  </span>
                </button>
              )}
              <Link href={`/people/${item.person.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-2.5">
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
