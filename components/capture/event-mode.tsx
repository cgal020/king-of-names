"use client";

import { useId, useState } from "react";
import { PartyPopperIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultEventName, type EventSession } from "@/lib/events/event";

// Shown on Capture while an event runs: what it is, how many takes so far,
// and the way out.
export function EventBanner({ event, onEnd }: { event: EventSession; onEnd: () => void }) {
  const count = event.takes.length;
  return (
    <div className="mt-1 flex items-center gap-3 rounded-2xl bg-accent py-2.5 pr-2 pl-4 text-accent-foreground">
      <span className="size-2 shrink-0 animate-blink rounded-full bg-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold tracking-[0.14em] uppercase">Event mode &middot; {event.name}</span>
        <span className="block text-sm">
          {count === 0 ? "Each tap of the mic saves a quick take." : `${count} ${count === 1 ? "take" : "takes"} saved. Review them when it’s over.`}
        </span>
      </span>
      <button
        type="button"
        onClick={onEnd}
        className="h-11 shrink-0 rounded-xl px-3 text-[0.9375rem] font-semibold underline underline-offset-3"
      >
        End
      </button>
    </div>
  );
}

export function StartEventSheet({ onStart, onCancel }: { onStart: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(() => defaultEventName());
  const inputId = useId();
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-scrim animate-in fade-in-0 duration-200 sm:items-center sm:justify-center" role="presentation">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-sheet-title"
        className="max-h-[90dvh] w-full overflow-y-auto sheet rounded-t-4xl bg-popover px-5 pt-5 text-popover-foreground shadow-sheet animate-in slide-in-from-bottom duration-280 ease-out pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          onStart(name.trim() || defaultEventName());
        }}
      >
        <PartyPopperIcon className="size-7 text-primary" aria-hidden />
        <h2 id="event-sheet-title" className="mt-3 type-sheet-title">
          Going somewhere busy?
        </h2>
        <p className="mt-2 text-[0.9375rem] leading-[1.45] text-muted-foreground">
          In event mode, each tap of the mic saves a quick take. Say their name and one thing to remember, then
          move on. When the event is over, you review them all at once.
        </p>
        <label htmlFor={inputId} className="mt-5 block text-sm font-medium">
          Name this event
        </label>
        <Input
          id={inputId}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2"
          maxLength={80}
          autoComplete="off"
        />
        <div className="mt-5 flex gap-2">
          <Button type="button" variant="outline" size="touch-lg" className="flex-1" onClick={onCancel}>
            Not now
          </Button>
          <Button type="submit" size="touch-lg" className="flex-[2]">
            Start event mode
          </Button>
        </div>
      </form>
    </div>
  );
}
