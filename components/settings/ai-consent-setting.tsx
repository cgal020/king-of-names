"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAiConsent } from "@/components/capture/ai-consent";
import { cn } from "@/lib/utils";

// Turns the AI consent on or off. Off means the app asks again before it
// sends the next note, card or question.
export function AiConsentSetting() {
  const { consented, agree, withdraw } = useAiConsent();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!consented) return agree();
    setBusy(true);
    const ok = await withdraw();
    setBusy(false);
    if (!ok) toast.error("That didn’t change", { description: "Check your connection and try again." });
  }

  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl bg-muted p-4 text-foreground">
      <span>
        <span className="block font-medium">Use AI to fill in profiles</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {consented
            ? "On. Notes, cards and questions are sent as described below."
            : "Off. The app asks before it sends a note, card or question to the AI."}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={consented}
        aria-label="Use AI to fill in profiles"
        disabled={busy}
        onClick={() => void toggle()}
        className={cn(
          "relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors duration-150 disabled:opacity-60",
          consented ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-background shadow-sm transition-transform duration-150",
            consented && "translate-x-5",
          )}
        />
      </button>
    </label>
  );
}
