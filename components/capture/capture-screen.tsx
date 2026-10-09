"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CameraIcon,
  CheckIcon,
  ChevronRightIcon,
  MapPinIcon,
  MapPinOffIcon,
  PartyPopperIcon,
  PencilLineIcon,
  ScanLineIcon,
  QrCodeIcon,
  SettingsIcon,
} from "lucide-react";
import { AiConsentSheet, hasAiConsent } from "@/components/capture/ai-consent";
import { CouldNotSend, processCapture, useCaptureQueue, WaitingToSend } from "@/components/capture/capture-queue";
import { EventBanner, StartEventSheet } from "@/components/capture/event-mode";
import { currentEvent, eventActions, useEventSession } from "@/components/capture/event-store";
import { InstallCoach } from "@/components/capture/install-coach";
import { RecordButton } from "@/components/capture/record-button";
import { useRecording } from "@/components/capture/recording-store";
import { usePlaceName } from "@/components/capture/use-place-name";
import { usePhotoPicker } from "@/components/photos/photo-picker";
import { usePhotosFor } from "@/components/photos/photo-store";
import { setRecordingChrome } from "@/components/tab-bar";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { authConfigured } from "@/lib/auth/config";
import { canRecordAudio, MAX_SECONDS, startRecording as startAudio, type Recording, type RecordingResult } from "@/lib/audio/recorder";
import { formatDistance, formatDuration, formatMetDateTime } from "@/lib/format";
import { describeWait } from "@/lib/captures/rate-limit";
import { isLive, openTakes, type EventSession } from "@/lib/events/event";
import { trackLocation, type LocationStatus } from "@/lib/geo/locate";
import { mockTakeDraft } from "@/lib/mock/events";
import { mockDraft, mockPendingReview } from "@/lib/mock/people";
import type { QueuedCapture } from "@/lib/offline/queue";
import type { Draft, Photo } from "@/lib/types";
import { cn } from "@/lib/utils";

// Mockup timings for the server pipeline after the upload. The real target
// is under 10 s.
const STEPS = ["Saving the recording", "Transcribing", "Picking out the details", "Finding the place"];
const STEP_MS = 650;

const LIMIT_TITLE = "That’s 60 notes in the last hour";
const limitDetail = (seconds: number) => `This one is saved on your phone and goes in ${describeWait(seconds)}.`;

const secondaryAction =
  "flex h-11 items-center gap-2 rounded-xl px-3 text-[0.9375rem] font-semibold text-primary transition-[transform,background-color] duration-120 hover:bg-muted active:scale-[0.97] active:bg-muted";

type Phase = "idle" | "recording" | "processing";
type LocationState = { state: "idle" } | LocationStatus;

export function CaptureScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [askingConsent, setAskingConsent] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [location, setLocation] = useState<LocationState>({ state: "idle" });
  const [step, setStep] = useState(0);
  // The first step, saving the recording, ends when the upload does.
  const [uploaded, setUploaded] = useState(false);
  // The note on the server (accounts connected) and whether its draft is ready.
  const [noteId, setNoteId] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);
  // True while the real microphone is recording; false for the simulation
  // used where the browser can't record (insecure page, no MediaRecorder).
  const [live, setLive] = useState(false);
  const startedAt = useRef(0);
  const recording = useRef<Recording | null>(null);
  const tracker = useRef<ReturnType<typeof trackLocation> | null>(null);
  const { placeName, reset: resetPlace } = usePlaceName(location.state === "found" ? location.fix : null);
  const pressRef = useRef<() => void>(() => {});
  const picker = usePhotoPicker();
  // The note being made: photos taken on Capture belong to it. The preview
  // uses the sample draft's id, so its Review shows them.
  const [noteDraftId, setNoteDraftId] = useState(() => (authConfigured() ? crypto.randomUUID() : mockDraft.captureId));
  const draftPhotos = usePhotosFor({ captureId: noteDraftId });
  const { setRecording } = useRecording();
  const queue = useCaptureQueue();
  const openNotes = useOpenNotes(queue.waiting);
  const event = useEventSession();
  const eventLive = isLive(event);
  const [startingEvent, setStartingEvent] = useState(false);

  // Timer, the simulated level when the mic isn't live, and the 90 second cap.
  useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => {
      const seconds = (Date.now() - startedAt.current) / 1000;
      setElapsed(seconds);
      if (!live) {
        setLevel((prev) => Math.min(1, Math.max(0, prev * 0.6 + Math.random() * 0.55)));
        if (seconds >= MAX_SECONDS) void finish(null);
      }
    }, 100);
    return () => window.clearInterval(id);
    // finish only uses stable setters and the queue's stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, live]);

  // The tab bar steps aside while recording, so nothing competes with Stop.
  useEffect(() => {
    setRecordingChrome(phase === "recording");
    return () => setRecordingChrome(false);
  }, [phase]);

  // Walk through the pipeline steps, then open the review screen. With
  // accounts connected, the last step waits for the server's draft.
  useEffect(() => {
    if (phase !== "processing") return;
    if (step >= STEPS.length) {
      router.push(noteId ? `/capture/review?capture=${noteId}` : "/capture/review");
      return;
    }
    if (step === 0 && !uploaded) return;
    if (step === STEPS.length - 1 && noteId && !processed) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [phase, step, uploaded, noteId, processed, router]);

  // The "Record a note" home-screen shortcut opens /capture?record=1.
  useEffect(() => {
    pressRef.current = handlePress;
  });
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("record") !== "1") return;
    // Clear the flag in the same frame as the press, so a cancelled frame
    // (React re-running effects in development) leaves it for the next run.
    const id = requestAnimationFrame(() => {
      window.history.replaceState(null, "", "/capture");
      pressRef.current();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Leaving the screen mid-recording releases the microphone and stops GPS.
  useEffect(
    () => () => {
      recording.current?.cancel();
      tracker.current?.cancel();
    },
    [],
  );

  async function startRecording() {
    startedAt.current = Date.now();
    setElapsed(0);
    // Location starts with the recording, so the stamp is where the note was made.
    resetPlace();
    tracker.current?.cancel();
    tracker.current = trackLocation(setLocation);
    setPhase("recording");
    if (!canRecordAudio()) return;
    try {
      recording.current = await startAudio({ onLevel: setLevel, onAutoStop: finish });
      startedAt.current = Date.now();
      setLive(true);
    } catch {
      setPhase("idle");
      tracker.current?.cancel();
      setLocation({ state: "idle" });
      toast.error("Microphone is off", {
        description: "Allow microphone access for this site in your browser settings, then try again.",
      });
    }
  }

  async function stopRecording() {
    const current = recording.current;
    recording.current = null;
    void finish(current ? await current.stop() : null);
  }

  async function finish(result: RecordingResult | null) {
    setLevel(0);
    setLive(false);
    // This recording's own location watch, so starting the next take while
    // this one waits for a fix can't swap it out.
    const locating = tracker.current;
    tracker.current = null;
    const quickTake = isLive(currentEvent());
    if (quickTake) {
      // Event mode: straight back to the record button; the take is reviewed later.
      setPhase("idle");
      setLocation({ state: "idle" });
    } else {
      if (result) setRecording({ url: URL.createObjectURL(result.blob), durationSeconds: result.durationSeconds });
      setStep(0);
      setUploaded(false);
      setNoteId(null);
      setProcessed(false);
      setPhase("processing");
    }

    // The best fix from the recording; with none yet, a few more seconds,
    // then the note goes without one and the city is set on review.
    const located = (await locating?.done()) ?? { ok: false as const, reason: "unavailable" as const };
    const item: QueuedCapture = {
      // Quick takes get their own id; a note keeps the one its photos use.
      id: quickTake || !authConfigured() ? crypto.randomUUID() : noteDraftId,
      audio: result?.blob ?? new Blob([], { type: "audio/mp4" }),
      mime: result?.mime ?? "audio/mp4",
      durationSeconds: result?.durationSeconds ?? (Date.now() - startedAt.current) / 1000,
      recordedAt: new Date(startedAt.current).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: located.ok ? { lat: located.fix.lat, lng: located.fix.lng, accuracyM: located.fix.accuracyM } : null,
      attempts: 0,
      lastError: null,
    };
    if (quickTake) {
      saveTake(item, result);
      return;
    }
    // The next note starts fresh; this one's photos stay with it.
    if (authConfigured()) setNoteDraftId(crypto.randomUUID());
    void queue.sendNew(item).then((sent) => {
      if (sent.ok) {
        setUploaded(true);
        if (authConfigured()) {
          setNoteId(item.id);
          // Review processes it again if this doesn't get through.
          void processCapture(item.id)
            .catch(() => null)
            .finally(() => setProcessed(true));
        }
        return;
      }
      // No connection, or too weak to send: the note stays on the phone and
      // goes later. A refused note stays too, marked, for the user to see.
      setPhase("idle");
      setLocation({ state: "idle" });
      if (sent.refused) toast.error("This note couldn’t be sent", { description: sent.refused });
      else if (sent.retryAfterSeconds) toast(LIMIT_TITLE, { description: limitDetail(sent.retryAfterSeconds) });
      else toast("Saved on your phone", { description: "No connection right now. It’ll be sent when you’re back online." });
    });
  }

  function saveTake(item: QueuedCapture, result: RecordingResult | null) {
    const ongoing = currentEvent();
    if (!ongoing) return;
    const index = ongoing.takes.length;
    eventActions.addTake(
      {
        captureId: item.id,
        recordedAt: item.recordedAt,
        durationSeconds: item.durationSeconds,
        // The preview knows a sample up front; otherwise the server's draft
        // replaces this empty one once the take is read.
        draft: authConfigured() ? emptyTakeDraft(item) : mockTakeDraft(index, { ...item, captureId: item.id, eventName: ongoing.name }),
        readyAt: null,
        outcome: null,
      },
      result ? URL.createObjectURL(result.blob) : undefined,
    );
    toast.success(`Take ${index + 1} saved`, { description: "Say the next name whenever you’re ready." });
    void queue.sendNew(item).then((sent) => {
      if (sent.ok) {
        eventActions.markSent(item.id);
        if (authConfigured()) {
          void processCapture(item.id)
            .then(({ draft }) => draft && eventActions.setDraft(item.id, draft))
            .catch(() => {});
        }
      }
      else if (sent.refused) toast.error("This take couldn’t be sent", { description: sent.refused });
      else if (sent.retryAfterSeconds) toast(LIMIT_TITLE, { description: limitDetail(sent.retryAfterSeconds) });
    });
  }

  function endEvent() {
    eventActions.end();
    router.push("/capture/event");
  }

  function handlePress() {
    if (phase === "idle") {
      // The first recording asks for consent to send notes to the AI providers.
      if (hasAiConsent()) void startRecording();
      else setAskingConsent(true);
    } else if (phase === "recording") {
      void stopRecording();
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-var(--tabbar-h)-1.5rem)] max-w-xl flex-col px-5">
      <header className="flex min-h-14 items-center justify-between pt-[env(safe-area-inset-top)]">
        <Wordmark />
        <span className="-mr-2 flex items-center">
          {/* Your QR codes, one tap away when someone asks for your details. */}
          <Link href="/qr" aria-label="My QR codes" className={cn(buttonVariants({ variant: "ghost", size: "icon-touch" }), "text-muted-foreground")}>
            <QrCodeIcon />
          </Link>
          <Link href="/settings" aria-label="Settings" className={cn(buttonVariants({ variant: "ghost", size: "icon-touch" }), "text-muted-foreground")}>
            <SettingsIcon />
          </Link>
        </span>
      </header>
      {/* Kept in the layout while recording so the heading does not jump. */}
      <div className={cn(phase !== "idle" && "invisible")}>
        {eventLive ? <EventBanner event={event} onEnd={endEvent} /> : <InstallCoach />}
        {!eventLive && <NeedsReview event={event} notes={openNotes} />}
        <WaitingToSend waiting={queue.waiting} sending={queue.sending} onSend={() => void queue.send()} />
        <CouldNotSend notes={queue.rejected} onRemove={(id) => void queue.remove(id)} />
      </div>

      {/* Short screens (Safari with its toolbars) tighten up so the record button stays in view. */}
      <section className="flex flex-1 flex-col justify-center py-6 [@media(max-height:720px)]:py-3">
        {phase === "processing" ? (
          <ProcessingSteps step={step} />
        ) : (
          <>
            <h1 className="type-display [@media(max-height:720px)]:text-[2.25rem]">
              {phase === "recording" ? "Listening…" : eventLive ? "Who’s next?" : "Who did you just meet?"}
            </h1>
            <p className="mt-3 max-w-[34ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
              {eventLive
                ? "Say their name and one thing to remember."
                : "Say their name, where you are, and anything worth remembering."}
            </p>
            {draftPhotos.length > 0 && <DraftPhotos photos={draftPhotos} />}
          </>
        )}
      </section>

      <section className="flex flex-col items-center pb-6">
        <div aria-live="polite" className="mb-2 flex h-8 items-center justify-center">
          {phase === "recording" && (
            <span className="flex items-center gap-2 rounded-full bg-destructive-soft py-1.5 pr-3 pl-2.5 text-sm font-semibold text-destructive tabular-nums">
              <span className="size-[9px] animate-blink rounded-full bg-recording" aria-hidden />
              Recording &middot; {formatDuration(elapsed)}
              <span className="sr-only"> of {formatDuration(MAX_SECONDS)}</span>
            </span>
          )}
        </div>

        {picker.input}
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex justify-center">
            {phase === "idle" && (
              <SideAction href="/capture/card" label="Scan card" icon={<ScanLineIcon />} />
            )}
          </div>
          <RecordButton
            recording={phase === "recording"}
            level={level}
            progress={Math.min(1, elapsed / MAX_SECONDS)}
            disabled={phase === "processing"}
            onPress={handlePress}
          />
          <div className="flex justify-center">
            {phase !== "processing" && (
              <SideAction
                label="Photo"
                icon={<CameraIcon />}
                onClick={() => picker.open({ captureId: noteDraftId, kind: "moment", camera: true })}
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex h-11 items-center">
          {phase === "idle" ? (
            eventLive ? (
              <Link href="/capture/event" className={secondaryAction}>
                See takes so far
              </Link>
            ) : (
              <span className="flex items-center gap-1">
                <Link href="/people/new" className={secondaryAction}>
                  <PencilLineIcon className="size-4" aria-hidden />
                  Add manually
                </Link>
                <button type="button" className={secondaryAction} onClick={() => setStartingEvent(true)}>
                  <PartyPopperIcon className="size-4" aria-hidden />
                  Event mode
                </button>
              </span>
            )
          ) : (
            <LocationChip location={location} placeName={placeName} />
          )}
        </div>
      </section>
      {startingEvent && (
        <StartEventSheet
          onCancel={() => setStartingEvent(false)}
          onStart={(name) => {
            setStartingEvent(false);
            eventActions.start(name);
          }}
        />
      )}
      {askingConsent && (
        <AiConsentSheet
          onCancel={() => setAskingConsent(false)}
          onAgree={() => {
            setAskingConsent(false);
            startRecording();
          }}
        />
      )}
    </main>
  );
}

function SideAction({
  label,
  icon,
  href,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  // The whole 80x80 column is the tap target.
  const className =
    "group/side flex size-20 flex-col items-center justify-center gap-1.5 rounded-2xl text-[0.8125rem] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
  const circle = (
    <span className="grid size-13 place-items-center rounded-full bg-card text-foreground shadow-[inset_0_0_0_1px_var(--border)] transition-[transform,background-color] duration-120 group-active/side:scale-[0.96] group-active/side:bg-muted [&_svg]:size-5.5 [&_svg]:stroke-[1.8]">
      {icon}
    </span>
  );
  return href ? (
    <Link href={href} className={className}>
      {circle}
      {label}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {circle}
      {label}
    </button>
  );
}

function DraftPhotos({ photos }: { photos: Photo[] }) {
  return (
    <Link href="/capture/review" className="mt-5 flex items-center gap-3">
      <span className="flex -space-x-2">
        {photos.slice(0, 4).map((p) => (
          // eslint-disable-next-line @next/next/no-img-element -- object URLs
          <img key={p.id} src={p.url} alt="" className="size-10 rounded-lg border-2 border-background object-cover" />
        ))}
      </span>
      <span className="text-sm text-muted-foreground">
        {photos.length === 1 ? "1 photo" : `${photos.length} photos`} added to this note
      </span>
    </Link>
  );
}

// A take before the server has read it: when and where, nothing else yet.
function emptyTakeDraft(item: QueuedCapture): Draft {
  return {
    captureId: item.id,
    transcript: null,
    durationSeconds: Math.round(item.durationSeconds),
    nameConfidence: "high",
    additionalPeople: [],
    person: {
      full_name: "",
      met_at: item.recordedAt,
      met_timezone: item.timezone,
      lat: item.location?.lat ?? null,
      lng: item.location?.lng ?? null,
      location_accuracy_m: item.location?.accuracyM ?? null,
      place_name: null,
      city: null,
      region: null,
      country: null,
      where_met_text: null,
      phone: null,
      birthday_month: null,
      birthday_day: null,
      birthday_year: null,
      notes: null,
      follow_up_note: null,
      follow_up_date: null,
      extras: {},
      relationship: null,
      tags: [],
    },
  };
}

type OpenNote = { id: string; recordedAt: string | null; name: string | null; preview: string | null };

// Notes on the server waiting for a decision, refreshed when Capture opens,
// comes back into view, or the phone's queue sends something.
function useOpenNotes(queueWaiting: number) {
  const [notes, setNotes] = useState<OpenNote[]>([]);
  useEffect(() => {
    if (!authConfigured()) return;
    let cancelled = false;
    const load = () =>
      fetch("/api/captures", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { notes: [] }))
        .then((json: { notes?: OpenNote[] }) => {
          if (!cancelled) setNotes(json.notes ?? []);
        })
        .catch(() => {});
    void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [queueWaiting]);
  return notes;
}

// Notes waiting for a decision: takes from an event that has ended, notes on
// the server not yet saved or discarded, or the preview's sample note.
function NeedsReview({ event, notes }: { event: EventSession | null; notes: OpenNote[] }) {
  const takes = openTakes(event);
  const fromEvent = event && takes.length > 0;
  if (!fromEvent && authConfigured()) {
    if (!notes.length) return null;
    const first = notes[0];
    const when = first.recordedAt ? formatMetDateTime(first.recordedAt, null) : null;
    return (
      <Link
        href={`/capture/review?capture=${first.id}`}
        className="mt-2.5 flex min-h-14 items-center gap-3 rounded-2xl bg-muted px-3.5 py-3 transition-transform duration-120 active:scale-[0.98]"
      >
        <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[0.9375rem] font-semibold">
            {notes.length === 1 ? "1 note to review" : `${notes.length} notes to review`}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {[first.name, when].filter(Boolean).join(" · ") || first.preview || "Waiting to be read"}
          </span>
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    );
  }
  return (
    <Link
      href={fromEvent ? "/capture/event" : "/capture/review"}
      className="mt-2.5 flex min-h-14 items-center gap-3 rounded-2xl bg-muted px-3.5 py-3 transition-transform duration-120 active:scale-[0.98]"
    >
      <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-semibold">
          {fromEvent ? `${takes.length} ${takes.length === 1 ? "note" : "notes"} to review` : "1 note to review"}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {fromEvent ? `From ${event.name}` : mockPendingReview.preview}
        </span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

function LocationChip({ location, placeName }: { location: LocationState; placeName: string | null }) {
  if (location.state === "denied" || location.state === "unavailable") {
    return (
      <span className="flex min-h-8 items-center gap-1.5 text-sm font-medium text-warning">
        <MapPinOffIcon className="size-4" aria-hidden />
        {location.state === "denied" ? "Location is off." : "No location yet."} You can set the city next.
      </span>
    );
  }
  const fix = location.state === "found" ? location.fix : null;
  return (
    <span className="flex min-h-8 items-center gap-1.5 text-sm text-muted-foreground">
      {fix ? (
        <MapPinIcon className="size-4 text-primary" aria-hidden />
      ) : (
        <span className="size-3.5 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden />
      )}
      {fix ? (
        <>
          <span className="font-medium text-foreground">{placeName ?? "Location saved"}</span>
          <span>&middot; within {formatDistance(fix.accuracyM / 1000)}</span>
        </>
      ) : (
        "Finding where you are…"
      )}
    </span>
  );
}

function ProcessingSteps({ step }: { step: number }) {
  return (
    <div>
      <h1 className="type-display">Got it.</h1>
      <ol className="mt-5 space-y-3" aria-live="polite">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 text-[0.95rem] transition-colors duration-200",
                done ? "text-foreground" : active ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full border transition-colors duration-200",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "animate-pulse border-primary",
                )}
                aria-hidden
              >
                {done && <CheckIcon className="size-3" strokeWidth={3} />}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
