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
    <div className="mt-1 mb-2 flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
      <span className="relative flex size-2.5 shrink-0" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground/70 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2.5 rounded-full bg-primary-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">Event mode &middot; {event.name}</span>
        <span className="block text-sm opacity-85">
          {count === 0 ? "Each tap of the mic saves a quick take." : `${count} ${count === 1 ? "take" : "takes"} saved. Review them when it’s over.`}
        </span>
      </span>
      <button
        type="button"
        onClick={onEnd}
        className="h-9 shrink-0 rounded-lg border border-primary-foreground/40 px-3 text-sm font-medium"
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center" role="presentation">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-sheet-title"
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-background px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          onStart(name.trim() || defaultEventName());
        }}
      >
        <PartyPopperIcon className="size-7 text-primary" aria-hidden />
        <h2 id="event-sheet-title" className="mt-3 text-2xl font-semibold tracking-tight">
          Going somewhere busy?
        </h2>
        <p className="mt-2 text-[0.95rem] text-muted-foreground">
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
          className="mt-2 h-12 text-base"
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
