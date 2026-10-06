"use client";

import { MicIcon, SquareIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type RecordButtonProps = {
  recording: boolean;
  // 0..1 microphone level, drives the halo.
  level: number;
  // 0..1 share of the 90 second cap used so far.
  progress: number;
  disabled?: boolean;
  onPress: () => void;
};

const RING_RADIUS = 86;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export function RecordButton({ recording, level, progress, disabled, onPress }: RecordButtonProps) {
  return (
    <div className="relative grid size-48 place-items-center">
      {/* Level halo: grows with the voice while recording. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-6 rounded-full bg-primary/15 transition-[transform,opacity] duration-100 ease-out",
          recording ? "opacity-100" : "scale-90 opacity-0",
        )}
        style={recording ? { transform: `scale(${1 + level * 0.32})` } : undefined}
      />

      {/* Progress toward the 90 second cap. */}
      <svg aria-hidden viewBox="0 0 192 192" className="absolute inset-0 -rotate-90">
        <circle
          cx="96"
          cy="96"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="3"
          className={cn("stroke-border transition-opacity duration-200", !recording && "opacity-0")}
        />
        <circle
          cx="96"
          cy="96"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - progress)}
          className={cn(
            "stroke-primary transition-[stroke-dashoffset,opacity] duration-300 ease-linear",
            !recording && "opacity-0",
          )}
        />
      </svg>

      <button
        type="button"
        onClick={onPress}
        disabled={disabled}
        aria-label={recording ? "Stop recording" : "Start recording"}
        aria-pressed={recording}
        className={cn(
          "relative grid size-34 place-items-center rounded-full bg-primary text-primary-foreground",
          "shadow-[0_10px_30px_-10px_var(--brand)] transition-transform duration-150 ease-out",
          "outline-none focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-95 disabled:opacity-60",
        )}
      >
        {recording ? (
          <SquareIcon className="size-9 fill-current" strokeWidth={0} aria-hidden />
        ) : (
          <MicIcon className="size-11" strokeWidth={1.75} aria-hidden />
        )}
      </button>
    </div>
  );
}
