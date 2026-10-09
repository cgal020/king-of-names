"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { setAiConsent } from "@/app/actions/consent";
import { Button } from "@/components/ui/button";

// Whether the user agreed to send notes, cards and questions to the AI
// providers. With accounts it's kept on the account, so a new phone doesn't
// ask again; the preview keeps it on this phone.
const KEY = "king-of-names:ai-consent";
const EVENT = "king-of-names:ai-consent";

function readLocal() {
  try {
    return localStorage.getItem(KEY) === "yes";
  } catch {
    return false;
  }
}

function writeLocal(agree: boolean) {
  try {
    if (agree) localStorage.setItem(KEY, "yes");
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode: ask again next time.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribeLocal(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

type ConsentStore = { consented: boolean; agree: () => void; withdraw: () => Promise<boolean> };
const ConsentContext = createContext<ConsentStore | null>(null);

// `account` is the account's answer, read on the server; null in the preview.
export function AiConsentProvider({ account, children }: { account: boolean | null; children: React.ReactNode }) {
  const local = useSyncExternalStore(subscribeLocal, readLocal, () => false);
  const [onAccount, setOnAccount] = useState(account);
  const consented = onAccount ?? local;

  const agree = useCallback(() => {
    if (onAccount === null) return writeLocal(true);
    setOnAccount(true);
    // If this doesn't reach the server, the next phone simply asks again.
    void setAiConsent(true).catch(() => null);
  }, [onAccount]);

  const withdraw = useCallback(async () => {
    if (onAccount === null) {
      writeLocal(false);
      return true;
    }
    const result = await setAiConsent(false).catch(() => ({ ok: false }));
    if (result.ok) setOnAccount(false);
    return result.ok;
  }, [onAccount]);

  const value = useMemo(() => ({ consented, agree, withdraw }), [consented, agree, withdraw]);
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useAiConsent() {
  const store = useContext(ConsentContext);
  if (!store) throw new Error("useAiConsent must be used inside AiConsentProvider");
  return store;
}

// What leaves the phone and where it goes; shown on sign-up, the sheet and Settings.
export function AiProviderList({ className }: { className?: string }) {
  return (
    <ul className={className ?? "space-y-3 text-[0.95rem]"}>
      <li>
        <span className="font-medium">Your recordings</span> go to OpenAI (USA) to be turned into text.
      </li>
      <li>
        <span className="font-medium">The text</span> goes to Anthropic (USA) to pick out names and details, and so
        do photos of business cards and the digital card a card&rsquo;s QR code links to.
      </li>
      <li>
        <span className="font-medium">Ask AI questions</span> go to Anthropic with a summary of your people to answer
        from: names, where and when you met, work, tags, notes, follow-ups and tasks. Never their phone numbers or emails.
      </li>
      <li>
        <span className="font-medium">Your location</span> goes to Mapbox to find the place name.
      </li>
      <li>
        Everything is stored in a private database in Mumbai, India, that only your account can read. These providers
        don&rsquo;t train their models on it.
      </li>
    </ul>
  );
}

const PURPOSE = {
  note: { title: "Before your first note", intro: "To fill in a profile from your voice, a few things leave your phone:" },
  card: { title: "Before your first card", intro: "To read a card, a few things leave your phone:" },
  ask: { title: "Before your first question", intro: "To answer from your people, a few things leave your phone:" },
};

// Asked once per account (unless turned off in Settings), before the first
// note, card or question: what leaves the phone and where it goes.
export function AiConsentSheet({
  purpose = "note",
  onAgree,
  onCancel,
}: {
  purpose?: keyof typeof PURPOSE;
  onAgree: () => void;
  onCancel: () => void;
}) {
  const { agree } = useAiConsent();
  const { title, intro } = PURPOSE[purpose];
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
          {title}
        </h2>
        <p className="mt-2 text-[0.95rem] text-muted-foreground">{intro}</p>
        <AiProviderList className="mt-4 space-y-3 text-[0.95rem]" />
        <p className="mt-4 text-sm text-muted-foreground">
          Only note what you&rsquo;d be comfortable with the person knowing you keep. You can turn this off in
          Settings.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" size="touch-lg" className="flex-1" onClick={onCancel}>
            Not now
          </Button>
          <Button
            size="touch-lg"
            className="flex-[2]"
            onClick={() => {
              agree();
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
