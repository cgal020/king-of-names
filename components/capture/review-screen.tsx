"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { AudioLinesIcon, MapPinOffIcon, TextSearchIcon } from "lucide-react";
import { eventActions, takeAudio, useEventSession } from "@/components/capture/event-store";
import { PersonForm } from "@/components/person-form";
import { ScreenHeader } from "@/components/screen-header";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Person } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDuration, formatMetDateTime } from "@/lib/format";
import { mockDraft } from "@/lib/mock/people";
import { reviewStateDraft, type ReviewState } from "@/lib/mock/review-states";
import type { Draft } from "@/lib/types";
import type { ReviewNote } from "@/lib/data/captures";

const noSubscribe = () => () => {};

// Review for the note just recorded, or for one take from an event.
export function ReviewScreen({
  captureId,
  previewState,
  people,
  note,
}: {
  captureId: string | null;
  previewState: ReviewState | null;
  people: Person[];
  // The note from the server. undefined in the sample-data preview; null when
  // there's no such note (yet).
  note?: ReviewNote | null;
}) {
  const event = useEventSession();
  // Takes live in the browser, so wait for it before deciding a take is gone.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  if (captureId && !hydrated) return null;

  const index = captureId ? (event?.takes.findIndex((t) => t.captureId === captureId) ?? -1) : -1;
  const take = index >= 0 ? event!.takes[index] : null;
  const stored = note !== undefined;
  const back = take ? "/capture/event" : "/capture";

  if ((stored && (!note || note.done)) || (!stored && captureId && (!take || take.outcome))) {
    const message = !stored || note?.done
      ? "This note has already been saved or discarded."
      : captureId
        ? "This note hasn’t reached the server yet. It’s saved on your phone and appears here once it’s sent."
        : "Nothing to review right now.";
    return (
      <main className="mx-auto max-w-xl px-5">
        <ScreenHeader title="Review" back={{ href: back, label: take ? "Takes" : "Capture" }} showSettings={false} />
        <p className="mt-6 text-[0.95rem] text-muted-foreground">{message}</p>
        <Link href={back} className={buttonVariants({ size: "touch-lg", className: "mt-6 w-full" })}>
          {take ? "Back to the takes" : "Back to Capture"}
        </Link>
      </main>
    );
  }

  const draft = note?.draft ?? take?.draft ?? (previewState ? reviewStateDraft(previewState) : mockDraft);
  const failed = draft.failedSteps ?? [];
  const url = note ? note.audioUrl : take ? takeAudio(take.captureId) : null;
  const durationSeconds = note ? draft.durationSeconds : (take?.durationSeconds ?? null);

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
      {failed.length > 0 && <PipelineNotice draft={draft} stored={stored} />}
      <PersonForm
        key={draft.captureId + failed.join()}
        mode="review"
        initial={draft.person}
        people={people}
        captureId={draft.captureId}
        transcript={draft.transcript}
        durationSeconds={draft.durationSeconds}
        nameConfidence={draft.nameConfidence}
        alsoMentioned={draft.additionalPeople}
        transcriptOpen={failed.includes("extraction")}
        stored={stored}
        audio={note || take ? (url ? { url, durationSeconds: durationSeconds ?? 0 } : null) : undefined}
        after={
          take
            ? { href: "/capture/event", onDone: (outcome) => eventActions.decide(take.captureId, outcome) }
            : undefined
        }
      />
    </main>
  );
}

// What went wrong in processing and what to do about it. The recording is
// always kept, so nothing said is lost.
function PipelineNotice({ draft, stored }: { draft: Draft; stored: boolean }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const failed = draft.failedSteps ?? [];

  // The preview's second try always works.
  async function retry() {
    setRetrying(true);
    if (stored) {
      const response = await fetch(`/api/captures/${draft.captureId}/process?retry=1`, { method: "POST" }).catch(() => null);
      const result: { status?: string } | null = response?.ok ? await response.json() : null;
      setRetrying(false);
      if (result?.status === "extracted") toast.success("Transcribed this time");
      else toast.error("Still couldn’t transcribe it", { description: "Play it below and type in what you need." });
      router.refresh();
      return;
    }
    window.setTimeout(() => {
      toast.success("Transcribed this time");
      router.replace("/capture/review");
    }, 1200);
  }

  if (failed.includes("transcription")) {
    return (
      <Notice tone="error" icon={<AudioLinesIcon className="size-5" aria-hidden />} title="We couldn’t turn this recording into text">
        <p>
          Your recording is safe. Try again in a moment, or play it below and type in what you need.
        </p>
        <Button variant="outline" className="mt-3 h-9 self-start rounded-xl bg-background px-3.5" disabled={retrying} onClick={() => void retry()}>
          {retrying ? "Trying again…" : "Try again"}
        </Button>
      </Notice>
    );
  }
  if (failed.includes("extraction")) {
    return (
      <Notice icon={<TextSearchIcon className="size-5" aria-hidden />} title="We couldn’t pick out the details">
        <p>The transcript is open below. Fill in the name and anything else you want to keep.</p>
      </Notice>
    );
  }
  return (
    <Notice icon={<MapPinOffIcon className="size-5" aria-hidden />} title="We couldn’t find the place name">
      <p>Where you were is saved. Set the city below so you can find this person on the map.</p>
    </Notice>
  );
}

// Errors on destructive-soft, softer problems on warning-soft; always an
// icon and words, never colour alone.
function Notice({
  icon,
  title,
  tone = "warning",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone?: "warning" | "error";
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "mb-6 flex gap-3 rounded-2xl px-4 py-3.5 text-[0.9375rem]",
        tone === "error" ? "bg-destructive-soft" : "bg-warning-soft",
      )}
    >
      <span className={cn("mt-0.5", tone === "error" ? "text-destructive" : "text-warning")}>{icon}</span>
      <div className="flex min-w-0 flex-col">
        <p className={cn("font-semibold", tone === "error" ? "text-destructive" : "text-warning")}>{title}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}
