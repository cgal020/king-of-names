"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon, PauseIcon, PlayIcon } from "lucide-react";
import { formatDuration } from "@/lib/format";

// The recording and its transcript. Mockup: the play button animates but has
// no audio; the real one streams from a short-lived signed URL.
export function OriginalNote({
  transcript,
  durationSeconds,
  defaultOpen = false,
}: {
  transcript: string | null;
  durationSeconds: number | null;
  defaultOpen?: boolean;
}) {
  const duration = durationSeconds ?? 0;
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setPosition((p) => {
        if (p + 0.1 >= duration) {
          setPlaying(false);
          return 0;
        }
        return p + 0.1;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, duration]);

  return (
    <div className="rounded-2xl bg-muted/60">
      {durationSeconds !== null && (
        <div className="flex items-center gap-3 p-2 pr-4">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause recording" : "Play recording"}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-background text-foreground shadow-xs transition-transform duration-150 active:scale-95"
          >
            {playing ? (
              <PauseIcon className="size-4 fill-current" aria-hidden />
            ) : (
              <PlayIcon className="ml-0.5 size-4 fill-current" aria-hidden />
            )}
          </button>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear"
              style={{ width: `${duration ? (position / duration) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatDuration(playing ? position : duration)}
          </span>
        </div>
      )}
      {transcript && (
        <details open={defaultOpen} className="group border-t border-background/80 px-4">
          <summary className="flex h-11 cursor-pointer list-none items-center justify-between text-sm font-medium [&::-webkit-details-marker]:hidden">
            Transcript
            <ChevronDownIcon
              className="size-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="pb-4 text-[0.95rem] leading-relaxed text-muted-foreground">{transcript}</p>
        </details>
      )}
    </div>
  );
}
