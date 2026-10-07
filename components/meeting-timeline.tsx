"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPinIcon, MicIcon, PlusIcon } from "lucide-react";
import { OriginalNote } from "@/components/original-note";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatMetDate } from "@/lib/format";
import { mockCurrentLocation } from "@/lib/mock/people";
import type { Encounter } from "@/lib/types";
import { cn } from "@/lib/utils";

// Every time you met someone, newest first, with a quick way to add another.
// Mockup: new meetings live in memory; the real app records them as captures.
export function MeetingTimeline({ personId, initial }: { personId: string; initial: Encounter[] }) {
  const [meetings, setMeetings] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState("");
  const [listening, setListening] = useState(false);

  // Mockup voice note: "hears" a sample after a moment.
  useEffect(() => {
    if (!listening) return;
    const id = window.setTimeout(() => {
      setListening(false);
      setNote("Caught up at the Marina. Asked about a Bangkok introduction; follow up next week.");
    }, 1800);
    return () => window.clearTimeout(id);
  }, [listening]);

  function save() {
    if (!note.trim()) return;
    setMeetings((list) => [
      {
        id: crypto.randomUUID(),
        person_id: personId,
        met_at: new Date().toISOString(),
        met_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        place_name: mockCurrentLocation.placeName,
        city: mockCurrentLocation.city,
        where_met_text: null,
        note: note.trim(),
        transcript: null,
        duration_seconds: null,
      },
      ...list,
    ]);
    setNote("");
    setAdding(false);
    toast.success("Meeting added", { description: "Preview only. Nothing was stored." });
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {meetings.length === 1 ? "Met once" : `Met ${meetings.length} times`}
        </h2>
        {!adding && (
          <Button variant="ghost" size="touch" className="-mr-3 text-primary" onClick={() => setAdding(true)}>
            <PlusIcon aria-hidden />
            Met again
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-5 rounded-2xl bg-muted p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="size-4 text-primary" aria-hidden />
            Now &middot; {mockCurrentLocation.placeName}, {mockCurrentLocation.city}
          </p>
          <div className="relative mt-3">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={listening ? "Listening…" : "What's new with them?"}
              aria-label="Note about this meeting"
              rows={3}
              className="min-h-24 rounded-xl bg-background px-3.5 py-2.5 pr-12 text-base"
            />
            <button
              type="button"
              onClick={() => setListening(true)}
              aria-label="Record a note"
              aria-pressed={listening}
              className={cn(
                "absolute top-2 right-2 grid size-9 place-items-center rounded-lg",
                listening ? "animate-pulse text-primary" : "text-muted-foreground",
              )}
            >
              <MicIcon className="size-5" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="touch" className="flex-1" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="touch" className="flex-[2]" onClick={save} disabled={!note.trim()}>
              Add meeting
            </Button>
          </div>
        </div>
      )}

      <ol className="relative ml-1.5 border-l border-border">
        {meetings.map((m, i) => {
          const first = i === meetings.length - 1;
          const place = m.where_met_text ?? [m.place_name, m.city].filter(Boolean).join(", ");
          return (
            <li key={m.id} className="relative pb-6 pl-5 last:pb-0">
              <span
                className={cn(
                  "absolute top-1.5 -left-[5px] size-2.5 rounded-full ring-4 ring-background",
                  i === 0 ? "bg-primary" : "bg-muted-foreground/50",
                )}
                aria-hidden
              />
              <p className="text-[0.95rem] font-medium">
                {formatMetDate(m.met_at, m.met_timezone)}
                {first && meetings.length > 1 && <span className="font-normal text-muted-foreground"> &middot; first met</span>}
              </p>
              {place && (
                <p className="text-sm text-muted-foreground">
                  {place}
                  {m.city && !place.includes(m.city) && `, ${m.city}`}
                </p>
              )}
              {m.note && <p className="mt-1.5 max-w-[65ch] text-[0.95rem] leading-relaxed text-pretty">{m.note}</p>}
              {(m.transcript || m.duration_seconds) && (
                <div className="mt-2">
                  <OriginalNote transcript={m.transcript} durationSeconds={m.duration_seconds} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
