"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { eventActions, takeAudio, useEventSession } from "@/components/capture/event-store";
import { PersonForm } from "@/components/person-form";
import { ScreenHeader } from "@/components/screen-header";
import { buttonVariants } from "@/components/ui/button";
import { formatDuration, formatMetDateTime } from "@/lib/format";
import { mockDraft } from "@/lib/mock/people";

const noSubscribe = () => () => {};

// Review for the note just recorded, or for one take from an event.
export function ReviewScreen({ captureId }: { captureId: string | null }) {
  const event = useEventSession();
  // Takes live in the browser, so wait for it before deciding a take is gone.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  if (captureId && !hydrated) return null;

  const index = captureId ? (event?.takes.findIndex((t) => t.captureId === captureId) ?? -1) : -1;
  const take = index >= 0 ? event!.takes[index] : null;

  if (captureId && (!take || take.outcome)) {
    return (
      <main className="mx-auto max-w-xl px-5">
        <ScreenHeader title="Review" back={{ href: "/capture/event", label: "Takes" }} showSettings={false} />
        <p className="mt-6 text-[0.95rem] text-muted-foreground">This note has already been saved or discarded.</p>
        <Link href="/capture/event" className={buttonVariants({ size: "touch-lg", className: "mt-6 w-full" })}>
          Back to the takes
        </Link>
      </main>
    );
  }

  const draft = take?.draft ?? mockDraft;
  const url = take ? takeAudio(take.captureId) : null;

  return (
    <main className="mx-auto max-w-xl px-5">
      <ScreenHeader
        title="Review"
        back={take ? { href: "/capture/event", label: "Takes" } : undefined}
        showSettings={false}
      />
      <p className="-mt-1 mb-6 text-sm text-muted-foreground">
        {take && (
          <>
            Take {index + 1} of {event!.takes.length} &middot; {event!.name} &middot;{" "}
          </>
        )}
        Recorded {formatMetDateTime(draft.person.met_at, draft.person.met_timezone)}
        {draft.durationSeconds !== null && <> &middot; {formatDuration(draft.durationSeconds)}</>}
      </p>
      <PersonForm
        key={draft.captureId}
        mode="review"
        initial={draft.person}
        captureId={draft.captureId}
        transcript={draft.transcript}
        durationSeconds={draft.durationSeconds}
        nameConfidence={draft.nameConfidence}
        audio={take ? (url ? { url, durationSeconds: take.durationSeconds } : null) : undefined}
        after={
          take
            ? { href: "/capture/event", onDone: (outcome) => eventActions.decide(take.captureId, outcome) }
            : undefined
        }
      />
    </main>
  );
}
