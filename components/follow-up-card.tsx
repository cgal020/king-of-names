"use client";

import { useState, useSyncExternalStore } from "react";
import { AlarmClockIcon, BellIcon, CheckIcon } from "lucide-react";
import { useFollowUpActions } from "@/components/follow-up-actions";
import { Button } from "@/components/ui/button";
import { formatShortDate } from "@/lib/format";
import type { Person } from "@/lib/types";
import { daysUntil, whenLabel } from "@/lib/upcoming";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};
// Today, on the phone, so "overdue" is right whenever the page was built.
const todayKey = () => new Date().toDateString();

// The follow-up on a profile, with Done and Snooze.
export function FollowUpCard({ person }: { person: Person }) {
  const today = useSyncExternalStore(noSubscribe, todayKey, () => null);
  const [gone, setGone] = useState(false);
  const { done, snooze } = useFollowUpActions((_, g) => setGone(g));
  if (gone || !(person.follow_up_note || person.follow_up_date)) return null;
  const inDays = today && person.follow_up_date ? daysUntil(person.follow_up_date, new Date(today)) : null;

  return (
    <div className="mt-4 rounded-2xl bg-accent p-4 text-accent-foreground">
      <div className="flex gap-3">
        <BellIcon className="mt-0.5 size-4.5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            Follow up{person.follow_up_date && <> &middot; {formatShortDate(person.follow_up_date)}</>}
            {inDays !== null && inDays <= 0 && (
              <span className={cn("ml-1.5", inDays < 0 && "text-destructive")}>({whenLabel(inDays).toLowerCase()})</span>
            )}
          </p>
          {person.follow_up_note && <p className="mt-0.5 text-[0.95rem]">{person.follow_up_note}</p>}
        </div>
      </div>
      <div className="mt-3 flex gap-2 pl-7.5">
        <Button size="touch" variant="outline" className="bg-background/60" onClick={() => void done(person)}>
          <CheckIcon aria-hidden />
          Done
        </Button>
        <Button size="touch" variant="ghost" onClick={() => void snooze(person)}>
          <AlarmClockIcon aria-hidden />
          Snooze a week
        </Button>
      </div>
    </div>
  );
}
