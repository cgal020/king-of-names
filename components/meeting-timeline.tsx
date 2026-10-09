"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPinIcon, MicIcon, PlusIcon } from "lucide-react";
import { addMeeting } from "@/app/actions/notes";
import { OriginalNote } from "@/components/original-note";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { authConfigured } from "@/lib/auth/config";
import { formatMetDate } from "@/lib/format";
import { locateOnce } from "@/lib/geo/locate";
import { mockCurrentLocation } from "@/lib/mock/people";
import type { Encounter } from "@/lib/types";
import { cn } from "@/lib/utils";

// Every time you met someone, newest first, with a quick way to add another.
// "Met again" saves a typed note stamped with now and where the phone is; the
// preview keeps it in memory.
export function MeetingTimeline({ personId, initial }: { personId: string; initial: Encounter[] }) {
  const router = useRouter();
  const real = authConfigured();
  const [previewMeetings, setMeetings] = useState(initial);
  // Saved meetings come back from the server after each save.
  const meetings = real ? initial : previewMeetings;
  const [saving, setSaving] = useState(false);
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

  async function save() {
    if (!note.trim() || saving) return;
    if (real) {
      setSaving(true);
      const located = await locateOnce(undefined, 4_000);
      const result = await addMeeting(personId, note, {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: located.ok ? { lat: located.fix.lat, lng: located.fix.lng, accuracyM: located.fix.accuracyM } : null,
      }).catch(() => ({ ok: false as const, error: "That didn’t save. Check your connection and try again." }));
      setSaving(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setNote("");
      setAdding(false);
      toast.success("Meeting added");
      router.refresh();
      return;
    }
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
        <h2 className="type-section">
          {meetings.length === 0 ? "No meetings yet" : meetings.length === 1 ? "Met once" : `Met ${meetings.length} times`}
        </h2>
        {!adding && (
          <Button variant="ghost" size="touch" className="-mr-3 text-primary" onClick={() => setAdding(true)}>
            <PlusIcon aria-hidden />
            {meetings.length === 0 ? "Add a meeting" : "Met again"}
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-5 rounded-2xl bg-muted p-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="size-4 text-primary" aria-hidden />
            {real ? "Now, where you are" : `Now · ${mockCurrentLocation.placeName}, ${mockCurrentLocation.city}`}
          </p>
          <div className="relative mt-3">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={listening ? "Listening…" : "What's new with them?"}
              aria-label="Note about this meeting"
              rows={3}
              className={cn("min-h-24 bg-background", !real && "pr-12")}
            />
            {/* Preview only: a voice note here "hears" a sample. */}
            {!real && (
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
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="touch" className="flex-1" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="touch" className="flex-[2]" onClick={() => void save()} disabled={!note.trim() || saving}>
              {saving ? "Saving…" : "Add meeting"}
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
                  <OriginalNote transcript={m.transcript} durationSeconds={m.duration_seconds} src={m.audio_url} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
