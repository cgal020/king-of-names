"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { CheckIcon, ChevronRightIcon, CloudUploadIcon, LoaderCircleIcon, PartyPopperIcon } from "lucide-react";
import { processCapture } from "@/components/capture/capture-queue";
import { eventActions, useEventSession } from "@/components/capture/event-store";
import { ScreenHeader } from "@/components/screen-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { authConfigured } from "@/lib/auth/config";
import { openTakes, takeDetail, takeStatus, type Take, type TakeStatus } from "@/lib/events/event";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};

function time(iso: string, timeZone?: string | null) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: timeZone ?? undefined }).format(
    new Date(iso),
  );
}

// Every take from the current (or just ended) event, to review one by one.
export function EventTakes() {
  const router = useRouter();
  const event = useEventSession();
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [now, setNow] = useState(() => Date.now());
  const processing = event?.takes.some((t) => takeStatus(t, now) === "processing") ?? false;

  // Takes finish processing on their own; tick while any are still going.
  useEffect(() => {
    if (!processing) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [processing]);

  // Sent takes the server hasn't read yet (the app was closed mid-way): read
  // them now. Saved notes are skipped; the server answers at once for those
  // already read.
  const unread = event?.takes.filter((t) => t.readyAt && !t.processed && !t.outcome).map((t) => t.captureId).join() ?? "";
  useEffect(() => {
    if (!authConfigured() || !unread) return;
    for (const id of unread.split(",")) {
      void processCapture(id)
        .then(({ draft }) => draft && eventActions.setDraft(id, draft))
        .catch(() => {});
    }
  }, [unread]);

  if (!hydrated) return null;

  if (!event) {
    return (
      <main className="mx-auto max-w-xl px-5">
        <ScreenHeader title="Event" back={{ href: "/capture", label: "Capture" }} showSettings={false} />
        <div className="mt-10 flex flex-col items-start gap-3">
          <PartyPopperIcon className="size-8 text-muted-foreground" aria-hidden />
          <h2 className="type-sheet-title">No event right now</h2>
          <p className="max-w-[40ch] text-[0.95rem] text-muted-foreground">
            Going somewhere busy? Start event mode on Capture. Each tap of the mic saves a quick take, and you
            review them all here afterwards.
          </p>
          <Link href="/capture" className={buttonVariants({ size: "touch-lg", className: "mt-3" })}>
            Back to Capture
          </Link>
        </div>
      </main>
    );
  }

  const live = !event.endedAt;
  const open = openTakes(event);
  const nextReady = open.find((t) => takeStatus(t, now) === "ready");
  const count = event.takes.length;

  function finish() {
    eventActions.close();
    toast.success("Event closed");
    router.push("/capture");
  }

  return (
    <main className="mx-auto max-w-xl px-5 pb-8">
      <ScreenHeader back={{ href: "/capture", label: "Capture" }} showSettings={false} />
      <p className="type-section">{live ? "Going on now" : "Event over"}</p>
      <h1 className="type-heading mt-1">{event.name}</h1>
      <p className="mt-2 text-[0.95rem] text-muted-foreground">
        {count === 0
          ? "No takes yet."
          : `${count} ${count === 1 ? "take" : "takes"}${open.length ? ` · ${open.length} to review` : " · all reviewed"}`}
        {!live && ` · ended ${time(event.endedAt!)}`}
      </p>

      {count > 0 && (
        <ol className="mt-6 divide-y border-y">
          {event.takes.map((take, i) => (
            <TakeRow key={take.captureId} take={take} number={i + 1} status={takeStatus(take, now)} />
          ))}
        </ol>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {live ? (
          <>
            <Button size="touch-lg" onClick={() => eventActions.end()}>
              End event and review
            </Button>
            <Link href="/capture" className={buttonVariants({ variant: "outline", size: "touch-lg" })}>
              Keep recording
            </Link>
          </>
        ) : open.length > 0 ? (
          <>
            {nextReady && (
              <Link
                href={`/capture/review?capture=${nextReady.captureId}`}
                className={buttonVariants({ size: "touch-lg" })}
              >
                Review next
              </Link>
            )}
            <Link href="/capture" className={buttonVariants({ variant: "outline", size: "touch-lg" })}>
              Review later
            </Link>
            <p className="text-center text-sm text-muted-foreground">They wait under &ldquo;to review&rdquo; on Capture.</p>
          </>
        ) : (
          <Button size="touch-lg" onClick={finish}>
            {count ? "Done" : "Close event"}
          </Button>
        )}
      </div>
    </main>
  );
}

const STATUS: Record<TakeStatus, { label: string; icon?: React.ReactNode; muted?: boolean }> = {
  waiting: { label: "Waiting to send", icon: <CloudUploadIcon className="size-3.5" aria-hidden /> },
  processing: { label: "Picking out the details", icon: <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden /> },
  ready: { label: "Ready to review" },
  saved: { label: "Saved", icon: <CheckIcon className="size-3.5" aria-hidden />, muted: true },
  discarded: { label: "Discarded", muted: true },
};

function TakeRow({ take, number, status }: { take: Take; number: number; status: TakeStatus }) {
  const s = STATUS[status];
  const known = status !== "waiting" && status !== "processing";
  const name = known ? take.draft.person.full_name || "Name not caught" : `Take ${number}`;
  const body = (
    <>
      <span className="w-6 shrink-0 pt-0.5 text-sm text-muted-foreground tabular-nums">{number}</span>
      <span className="min-w-0 flex-1">
        <bdi dir="auto" className={cn("block font-serif text-[1.3125rem] leading-[1.3]", s.muted && "text-muted-foreground")}>{name}</bdi>
        {known && <span className="block truncate text-sm text-muted-foreground">{takeDetail(take.draft)}</span>}
        <span
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-xs",
            status === "ready" ? "font-medium text-primary" : "text-muted-foreground",
          )}
        >
          {s.icon}
          {s.label} &middot; {time(take.recordedAt, take.draft.person.met_timezone)}
        </span>
      </span>
      {status === "ready" && <ChevronRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />}
    </>
  );
  return (
    <li>
      {status === "ready" ? (
        <Link href={`/capture/review?capture=${take.captureId}`} className="flex min-h-14.5 gap-3 py-3 transition-colors hover:bg-muted/60 active:bg-muted">
          {body}
        </Link>
      ) : (
        <div className="flex min-h-14.5 gap-3 py-3">{body}</div>
      )}
    </li>
  );
}
