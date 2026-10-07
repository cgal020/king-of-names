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
  PencilLineIcon,
  ScanLineIcon,
  SettingsIcon,
} from "lucide-react";
import { AiConsentSheet, hasAiConsent } from "@/components/capture/ai-consent";
import { uploadCapture, useCaptureQueue, WaitingToSend } from "@/components/capture/capture-queue";
import { InstallCoach } from "@/components/capture/install-coach";
import { RecordButton } from "@/components/capture/record-button";
import { useRecording } from "@/components/capture/recording-store";
import { usePhotoPicker } from "@/components/photos/photo-picker";
import { usePhotosFor } from "@/components/photos/photo-store";
import { buttonVariants } from "@/components/ui/button";
import { canRecordAudio, MAX_SECONDS, startRecording as startAudio, type Recording, type RecordingResult } from "@/lib/audio/recorder";
import { appConfig } from "@/lib/config";
import { formatDuration } from "@/lib/format";
import { mockCurrentLocation, mockDraft, mockPendingReview } from "@/lib/mock/people";
import type { QueuedCapture } from "@/lib/offline/queue";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";

// Mockup timings for the server pipeline after the upload. The real target
// is under 10 s.
const STEPS = ["Saving the recording", "Transcribing", "Picking out the details", "Finding the place"];
const STEP_MS = 650;

type Phase = "idle" | "recording" | "processing";
type LocationState = "idle" | "locating" | "found" | "unavailable";

export function CaptureScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [askingConsent, setAskingConsent] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [location, setLocation] = useState<LocationState>("idle");
  const [step, setStep] = useState(0);
  // The first step, saving the recording, ends when the upload does.
  const [uploaded, setUploaded] = useState(false);
  // True while the real microphone is recording; false for the simulation
  // used where the browser can't record (insecure page, no MediaRecorder).
  const [live, setLive] = useState(false);
  const startedAt = useRef(0);
  const recording = useRef<Recording | null>(null);
  const pressRef = useRef<() => void>(() => {});
  const picker = usePhotoPicker();
  const draftPhotos = usePhotosFor({ captureId: mockDraft.captureId });
  const { setRecording } = useRecording();
  const queue = useCaptureQueue();

  // Timer, the simulated level when the mic isn't live, and the 90 second cap.
  useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => {
      const seconds = (Date.now() - startedAt.current) / 1000;
      setElapsed(seconds);
      if (!live) {
        setLevel((prev) => Math.min(1, Math.max(0, prev * 0.6 + Math.random() * 0.55)));
        if (seconds >= MAX_SECONDS) finish(null);
      }
    }, 100);
    const locate = window.setTimeout(() => setLocation("found"), 1200);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(locate);
    };
    // finish only uses stable setters and the queue's stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, live]);

  // Walk through the pipeline steps, then open the review screen.
  useEffect(() => {
    if (phase !== "processing") return;
    if (step >= STEPS.length) {
      router.push("/capture/review");
      return;
    }
    if (step === 0 && !uploaded) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [phase, step, uploaded, router]);

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

  // Leaving the screen mid-recording releases the microphone.
  useEffect(() => () => recording.current?.cancel(), []);

  async function startRecording() {
    startedAt.current = Date.now();
    setElapsed(0);
    setLocation("locating");
    setPhase("recording");
    if (!canRecordAudio()) return;
    try {
      recording.current = await startAudio({ onLevel: setLevel, onAutoStop: finish });
      startedAt.current = Date.now();
      setLive(true);
    } catch {
      setPhase("idle");
      setLocation("idle");
      toast.error("Microphone is off", {
        description: "Allow microphone access for this site in your browser settings, then try again.",
      });
    }
  }

  async function stopRecording() {
    const current = recording.current;
    recording.current = null;
    finish(current ? await current.stop() : null);
  }

  function finish(result: RecordingResult | null) {
    setLevel(0);
    setLive(false);
    if (result) setRecording({ url: URL.createObjectURL(result.blob), durationSeconds: result.durationSeconds });

    const item: QueuedCapture = {
      id: crypto.randomUUID(),
      audio: result?.blob ?? new Blob([], { type: "audio/mp4" }),
      mime: result?.mime ?? "audio/mp4",
      durationSeconds: result?.durationSeconds ?? (Date.now() - startedAt.current) / 1000,
      recordedAt: new Date(startedAt.current).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: { lat: mockCurrentLocation.lat, lng: mockCurrentLocation.lng, accuracyM: mockCurrentLocation.accuracy },
      attempts: 0,
      lastError: null,
    };
    setStep(0);
    setUploaded(false);
    setPhase("processing");
    uploadCapture(item).then(
      () => setUploaded(true),
      // No connection, or too weak to send: keep the note on the phone and
      // send it later.
      async () => {
        await queue.save(item);
        setPhase("idle");
        setLocation("idle");
        toast("Saved on your phone", { description: "No connection right now. It’ll be sent when you’re back online." });
      },
    );
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
        <span className="font-semibold tracking-tight">{appConfig.name}</span>
        <Link
          href="/settings"
          aria-label="Settings"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-touch" }), "-mr-2 text-muted-foreground")}
        >
          <SettingsIcon />
        </Link>
      </header>
      {/* Kept in the layout while recording so the heading does not jump. */}
      <div className={cn(phase !== "idle" && "invisible")}>
        <InstallCoach />
        <NeedsReview />
        <WaitingToSend waiting={queue.waiting} sending={queue.sending} onSend={() => void queue.send()} />
      </div>

      {/* Short screens (Safari with its toolbars) tighten up so the record button stays in view. */}
      <section className="flex flex-1 flex-col justify-center py-6 [@media(max-height:720px)]:py-3">
        {phase === "processing" ? (
          <ProcessingSteps step={step} />
        ) : (
          <>
            <h1 className="text-[2rem] leading-tight font-semibold tracking-tight [@media(max-height:720px)]:text-[1.75rem]">
              {phase === "recording" ? "Listening…" : "Who did you just meet?"}
            </h1>
            <p className="mt-2 max-w-[34ch] text-[0.95rem] text-muted-foreground">
              Say their name, where you are, and anything worth remembering.
            </p>
            {draftPhotos.length > 0 && <DraftPhotos photos={draftPhotos} />}
          </>
        )}
      </section>

      <section className="flex flex-col items-center pb-6">
        <div aria-live="polite" className="mb-3 h-6 text-center">
          {phase === "recording" && (
            <span className="text-lg font-medium tabular-nums">
              {formatDuration(elapsed)}
              <span className="text-muted-foreground"> / {formatDuration(MAX_SECONDS)}</span>
            </span>
          )}
        </div>

        {picker.input}
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex justify-center">
            {phase === "idle" && (
              <SideAction href="/capture/card" label="Card" icon={<ScanLineIcon />} />
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
                onClick={() => picker.open({ captureId: mockDraft.captureId, kind: "moment", camera: true })}
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex h-11 items-center">
          {phase === "idle" ? (
            <Link
              href="/people/new"
              className="flex h-11 items-center gap-2 rounded-xl px-3 text-[0.95rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <PencilLineIcon className="size-4" aria-hidden />
              Add manually
            </Link>
          ) : (
            <LocationChip state={location} />
          )}
        </div>
      </section>
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
  const className =
    "flex flex-col items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground";
  const circle = (
    <span className="grid size-14 place-items-center rounded-full border bg-background shadow-xs transition-transform duration-150 active:scale-95 [&_svg]:size-5.5">
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

function NeedsReview() {
  return (
    <Link
      href="/capture/review"
      className="mt-1 flex items-center gap-3 rounded-2xl bg-muted px-4 py-3 transition-colors hover:bg-muted/70"
    >
      <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">1 note needs review</span>
        <span className="block truncate text-sm text-muted-foreground">{mockPendingReview.preview}</span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

function LocationChip({ state }: { state: LocationState }) {
  if (state === "unavailable") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPinOffIcon className="size-4" aria-hidden />
        No location. You can set the city next.
      </span>
    );
  }
  const found = state === "found";
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <MapPinIcon className={cn("size-4", found ? "text-primary" : "animate-pulse")} aria-hidden />
      {found ? (
        <>
          <span className="font-medium text-foreground">{mockCurrentLocation.placeName}</span>
          <span>&middot; within {mockCurrentLocation.accuracy} m</span>
        </>
      ) : (
        "Finding your location…"
      )}
    </span>
  );
}

function ProcessingSteps({ step }: { step: number }) {
  return (
    <div>
      <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">Got it.</h1>
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
