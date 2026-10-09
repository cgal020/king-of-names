"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { EllipsisIcon, EllipsisVerticalIcon, PlusSquareIcon, ShareIcon, SmartphoneIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";

const DISMISSED = "king-of-names:install-coach-dismissed";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

type Platform = "installed" | "ios" | "android" | "other";
const noSubscribe = () => () => {};

function detect(): Platform {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISSED) === "yes";
  } catch {
    return false;
  }
}

// A one-line nudge to add the app to the Home Screen, kept small so the
// record button stays in view. iPhone has no install prompt, so "How" opens
// an instruction screen with the Share steps instead.
export function InstallCoach() {
  const platform = useSyncExternalStore(noSubscribe, detect, () => "installed" as Platform);
  const dismissedAtStart = useSyncExternalStore(noSubscribe, wasDismissed, () => true);
  const [dismissed, setDismissed] = useState(false);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const capture = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  if (platform === "installed" || platform === "other" || dismissed || dismissedAtStart) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED, "yes");
    } catch {
      // Private mode: it shows again next time.
    }
  }

  const action = "h-9 shrink-0 rounded-lg px-2 text-sm font-medium text-primary";

  return (
    <div className="mt-1 flex items-center gap-1 rounded-2xl bg-accent py-2 pr-1 pl-3.5 text-accent-foreground">
      <span className="min-w-0 flex-1 py-1">
        <span className="block text-[0.9375rem] font-semibold">Add {appConfig.name} to your Home Screen</span>
        <span className="block text-sm">Opens in one tap and keeps notes safe with no signal.</span>
      </span>
      {platform === "android" && prompt ? (
        <button
          type="button"
          className={action}
          onClick={async () => {
            await prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === "accepted") dismiss();
            setPrompt(null);
          }}
        >
          Install
        </button>
      ) : (
        <button type="button" className={action} onClick={() => setShowSteps(true)}>
          How
        </button>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground"
      >
        <XIcon className="size-4" />
      </button>
      {showSteps && <InstallSteps platform={platform} onClose={() => setShowSteps(false)} />}
    </div>
  );
}

function InstallSteps({ platform, onClose }: { platform: "ios" | "android"; onClose: () => void }) {
  const steps =
    platform === "ios"
      ? [
          <>
            Tap <ShareIcon className="inline size-4 align-[-2px] text-primary" aria-label="Share" /> Share in your
            browser&rsquo;s toolbar. In Safari, if you don&rsquo;t see it, tap{" "}
            <EllipsisIcon className="inline size-4 align-[-3px] text-primary" aria-label="More" /> first.
          </>,
          <>
            Choose <PlusSquareIcon className="inline size-4 align-[-2px] text-primary" aria-hidden /> Add to Home
            Screen. You may need to scroll down the list.
          </>,
          <>
            Tap Add. If you see &ldquo;Open as Web App&rdquo;, leave it on. Then open {appConfig.name} from your Home
            Screen from now on.
          </>,
        ]
      : [
          <>
            In Chrome, tap the menu{" "}
            <EllipsisVerticalIcon className="inline size-4 align-[-3px] text-primary" aria-label="menu" />.
          </>,
          <>Choose &ldquo;Add to Home screen&rdquo; or &ldquo;Install app&rdquo;.</>,
          <>Open {appConfig.name} from your Home screen from now on.</>,
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-scrim animate-in fade-in-0 duration-200 sm:items-center sm:justify-center" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-steps-title"
        className="max-h-[90dvh] w-full overflow-y-auto sheet rounded-t-4xl bg-popover px-5 pt-5 text-popover-foreground shadow-sheet animate-in slide-in-from-bottom duration-280 ease-out pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl"
      >
        <SmartphoneIcon className="size-7 text-primary" aria-hidden />
        <h2 id="install-steps-title" className="mt-3 type-sheet-title">
          Add {appConfig.name} to your Home Screen
        </h2>
        <p className="mt-2 text-[0.95rem] text-muted-foreground">
          {platform === "ios" ? "iPhone has no install button, so it takes three taps." : "It takes two taps in Chrome."}{" "}
          From the Home Screen it opens straight to Capture, and notes you record with no signal wait on your phone
          until you&rsquo;re back online.
        </p>
        <ol className="mt-5 space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-[0.95rem]">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <Button size="touch-lg" className="mt-6 w-full" onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  );
}
