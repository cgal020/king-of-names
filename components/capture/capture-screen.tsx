"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { RecordButton } from "@/components/capture/record-button";
import { usePhotoPicker } from "@/components/photos/photo-picker";
import { usePhotosFor } from "@/components/photos/photo-store";
import { buttonVariants } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import { formatDuration } from "@/lib/format";
import { mockCurrentLocation, mockDraft, mockPendingReview } from "@/lib/mock/people";
import type { Photo } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_SECONDS = 90;

// Mockup timings for the server pipeline. The real target is under 10 s.
const STEPS = ["Saving the recording", "Transcribing", "Picking out the details", "Finding the place"];
const STEP_MS = 650;

type Phase = "idle" | "recording" | "processing";
type LocationState = "idle" | "locating" | "found" | "unavailable";

export function CaptureScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [location, setLocation] = useState<LocationState>("idle");
  const [step, setStep] = useState(0);
  const startedAt = useRef(0);
  const picker = usePhotoPicker();
  const draftPhotos = usePhotosFor({ captureId: mockDraft.captureId });

  // Timer, simulated mic level and the 90 second auto-stop.
  useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => {
      const seconds = (Date.now() - startedAt.current) / 1000;
      setElapsed(seconds);
      setLevel((prev) => Math.min(1, Math.max(0, prev * 0.6 + Math.random() * 0.55)));
      if (seconds >= MAX_SECONDS) setPhase("processing");
    }, 100);
    const locate = window.setTimeout(() => setLocation("found"), 1200);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(locate);
    };
  }, [phase]);

  // Walk through the pipeline steps, then open the review screen.
  useEffect(() => {
    if (phase !== "processing") return;
    if (step >= STEPS.length) {
      router.push("/capture/review");
      return;
    }
    const id = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [phase, step, router]);

  function handlePress() {
    if (phase === "idle") {
      startedAt.current = Date.now();
      setElapsed(0);
      setLocation("locating");
      setPhase("recording");
    } else if (phase === "recording") {
      setLevel(0);
      setStep(0);
      setPhase("processing");
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
        <NeedsReview />
      </div>

      <section className="flex flex-1 flex-col justify-center py-6">
        {phase === "processing" ? (
          <ProcessingSteps step={step} />
        ) : (
          <>
            <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">
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
