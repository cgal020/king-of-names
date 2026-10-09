"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, MicIcon, SparklesIcon } from "lucide-react";
import { AskAnswer } from "@/components/ask/ask-answer";
import { AiConsentSheet, useAiConsent } from "@/components/capture/ai-consent";
import { useAskStore } from "@/components/ask/ask-store";
import { ScreenHeader } from "@/components/screen-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { SUGGESTED_QUESTIONS } from "@/lib/ask/question";
import type { Person } from "@/lib/types";
import { authConfigured } from "@/lib/auth/config";
import { cn } from "@/lib/utils";

type Entry = { id: number; question: string; answer?: string };

export function AskScreen({ people }: { people: Person[] }) {
  const { pending, setPending } = useAskStore();
  const { consented } = useAiConsent();
  // A question handed over from People search starts the thread, once the
  // user has agreed to send questions to the AI.
  const [entries, setEntries] = useState<Entry[]>(() => (pending && consented ? [{ id: 1, question: pending }] : []));
  const [awaitingConsent, setAwaitingConsent] = useState<string | null>(() => (pending && !consented ? pending : null));
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(entries.length + 1);

  useEffect(() => {
    if (pending) setPending(null);
  }, [pending, setPending]);

  // Keep the newest answer in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length]);

  // Mockup voice question: "hears" a sample question after a moment.
  const askRef = useRef<(question: string) => void>(() => {});
  useEffect(() => {
    askRef.current = ask;
  });
  useEffect(() => {
    if (!listening) return;
    const id = window.setTimeout(() => {
      setListening(false);
      askRef.current("Who did I meet in Dubai who works in shipping?");
    }, 1600);
    return () => window.clearTimeout(id);
  }, [listening]);

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    if (!consented) return setAwaitingConsent(q);
    setEntries((list) => [...list, { id: nextId.current++, question: q }]);
    setText("");
  }

  return (
    <main className="mx-auto max-w-xl px-5 pb-28">
      {awaitingConsent !== null && (
        <AiConsentSheet
          purpose="ask"
          onCancel={() => setAwaitingConsent(null)}
          onAgree={() => {
            setEntries((list) => [...list, { id: nextId.current++, question: awaitingConsent }]);
            setText("");
            setAwaitingConsent(null);
          }}
        />
      )}
      <ScreenHeader
        title="Ask"
        actions={
          entries.length > 0 && (
            <Button variant="ghost" size="touch" className="text-primary" onClick={() => setEntries([])}>
              Clear
            </Button>
          )
        }
      />

      {people.length === 0 ? (
        <section className="pt-6">
          <h2 className="type-sheet-title max-w-[20ch]">
            Nothing to ask about yet
          </h2>
          <p className="mt-2 max-w-[38ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
            Ask answers from the people you&rsquo;ve saved. Record a few notes first, then ask things like
            &ldquo;Who did I meet in Dubai?&rdquo;
          </p>
          <Link href="/capture" className={cn(buttonVariants({ size: "touch-lg" }), "mt-6")}>
            <MicIcon aria-hidden />
            Record a note
          </Link>
        </section>
      ) : entries.length === 0 ? (
        <section className="pt-6">
          <h2 className="type-sheet-title max-w-[20ch]">
            What do you want to know about your people?
          </h2>
          <p className="mt-2 text-[1.0625rem] leading-relaxed text-muted-foreground">
            Ask by place, tag, date or name. Answers come only from your own notes.
          </p>
          <ul className="mt-6 divide-y border-y">
            {SUGGESTED_QUESTIONS.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => ask(q)}
                  className="flex min-h-13 w-full items-center gap-3 py-2 text-left text-[1.0625rem]"
                >
                  <SparklesIcon className="size-4 shrink-0 text-primary" aria-hidden />
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="divide-y" aria-live="polite">
          {entries.map((e, i) => (
            <AskAnswer
              key={e.id}
              question={e.question}
              people={people}
              history={entries.slice(0, i).flatMap((prev) => (prev.answer ? [{ question: prev.question, answer: prev.answer }] : []))}
              onAsk={ask}
              onAnswered={(answer) => setEntries((list) => list.map((x) => (x.id === e.id ? { ...x, answer } : x)))}
            />
          ))}
        </div>
      )}
      <div ref={endRef} />

      {/* Nothing to ask about until someone is saved. */}
      {people.length > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(text);
          }}
          className="fixed inset-x-0 bottom-(--tabbar-h) z-20 border-t bg-background/95 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-xl items-center gap-2 px-5 py-3">
            <div className="relative min-w-0 flex-1">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                enterKeyHint="send"
                placeholder={listening ? "Listening…" : "Ask anything about your people"}
                aria-label="Your question"
                className="h-12 w-full rounded-xl bg-muted pr-12 pl-4 text-[1.0625rem] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
              {/* Preview only until voice questions are transcribed. */}
              {!authConfigured() && (
                <button
                  type="button"
                  onClick={() => setListening(true)}
                  aria-label="Ask with your voice"
                  aria-pressed={listening}
                  className={cn(
                    "absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg",
                    listening ? "animate-pulse text-primary" : "text-muted-foreground",
                  )}
                >
                  <MicIcon className="size-5" />
                </button>
              )}
            </div>
            <Button type="submit" size="icon-touch" aria-label="Ask" disabled={!text.trim()} className="size-12 rounded-xl">
              <ArrowUpIcon />
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
