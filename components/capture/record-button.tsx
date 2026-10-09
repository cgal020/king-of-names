"use client";

import { MicIcon } from "lucide-react";
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

const RING_MASK = "radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px))";

// Idle: the gold mic with a hairline ring. Recording: recording red, a halo
// that follows the voice and a ring that fills toward the 90 second cap, so
// the state is unmistakable even in a dark bar.
export function RecordButton({ recording, level, progress, disabled, onPress }: RecordButtonProps) {
  return (
    <div className="relative grid size-44 place-items-center">
      {/* Progress toward the 90 second cap: a 6px ring. */}
      <span
        aria-hidden
        className={cn("absolute inset-0 rounded-full transition-opacity duration-200", !recording && "opacity-0")}
        style={{
          background: `conic-gradient(var(--recording) 0 ${progress * 360}deg, var(--muted) ${progress * 360}deg 360deg)`,
          mask: RING_MASK,
          WebkitMask: RING_MASK,
        }}
      />

      {/* Level halo: grows with the voice while recording. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-5 rounded-full bg-recording transition-[transform,opacity] duration-100 ease-out",
          recording ? "opacity-35" : "scale-90 opacity-0",
        )}
        style={recording ? { transform: `scale(${1 + level * 0.34})` } : undefined}
      />

      <button
        type="button"
        onClick={onPress}
        disabled={disabled}
        aria-label={recording ? "Stop recording" : "Start recording"}
        aria-pressed={recording}
        className={cn(
          "relative grid size-34 place-items-center rounded-full outline-none",
          "transition-[transform,background-color] duration-120 ease-out active:scale-[0.96] disabled:opacity-40",
          recording
            ? "bg-recording focus-visible:shadow-[0_0_0_4px_var(--background),0_0_0_7px_var(--ring)]"
            : "bg-(image:--brand-gold-gradient) text-brand-gold-foreground shadow-[0_0_0_7px_var(--background),0_0_0_8px_var(--brand-gold)] focus-visible:shadow-[0_0_0_4px_var(--background),0_0_0_7px_var(--ring)] active:bg-brand-gold active:bg-none",
        )}
      >
        {recording ? (
          <span className="size-10 rounded-[9px] bg-white" aria-hidden />
        ) : (
          <MicIcon className="size-11" strokeWidth={1.9} aria-hidden />
        )}
      </button>
    </div>
  );
}
