"use client";

import { ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "king-of-names:ai-consent";

// Mockup keeps the answer in this browser; the real app stores it on the
// user's profile so it follows them across devices.
export function hasAiConsent() {
  try {
    return localStorage.getItem(KEY) === "yes";
  } catch {
    return false;
  }
}

function saveAiConsent() {
  try {
    localStorage.setItem(KEY, "yes");
  } catch {
    // Private mode: ask again next time.
  }
}

// Shown once, before the first recording: what leaves the phone and where it goes.
export function AiConsentSheet({ onAgree, onCancel }: { onAgree: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-scrim animate-in fade-in-0 duration-200 sm:items-center sm:justify-center" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-consent-title"
        className="max-h-[90dvh] w-full overflow-y-auto sheet rounded-t-4xl bg-popover px-5 pt-5 text-popover-foreground shadow-sheet animate-in slide-in-from-bottom duration-280 ease-out pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl"
      >
        <ShieldCheckIcon className="size-7 text-primary" aria-hidden />
        <h2 id="ai-consent-title" className="mt-3 type-sheet-title">
          Before your first note
        </h2>
        <p className="mt-2 text-[0.95rem] text-muted-foreground">
          To fill in a profile from your voice, a few things leave your phone:
        </p>
        <ul className="mt-4 space-y-3 text-[0.95rem]">
          <li>
            <span className="font-medium">Your recording</span> goes to OpenAI (USA) to be turned into text.
          </li>
          <li>
            <span className="font-medium">The text</span> goes to Anthropic (USA) to pick out names and details.
            Business card photos, the digital card a card&rsquo;s QR code links to, and Ask AI questions go there too.
          </li>
          <li>
            <span className="font-medium">Your location</span> goes to Mapbox to find the place name.
          </li>
          <li>
            Everything is stored in a private database in Mumbai, India, that only your account can read. These providers
            don&rsquo;t train their models on it.
          </li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Only note what you&rsquo;d be comfortable with the person knowing you keep. You can change this in Settings.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" size="touch-lg" className="flex-1" onClick={onCancel}>
            Not now
          </Button>
          <Button
            size="touch-lg"
            className="flex-[2]"
            onClick={() => {
              saveAiConsent();
              onAgree();
            }}
          >
            I agree
          </Button>
        </div>
      </div>
    </div>
  );
}
