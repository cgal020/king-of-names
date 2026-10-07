"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, SparklesIcon } from "lucide-react";
import { PersonAvatar } from "@/components/photos/person-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { mockAnswer, type AskAnswer } from "@/lib/mock/ask";
import type { Person } from "@/lib/types";

// Answer to an Ask AI question, citing the people it drew on.
// Mockup: answers come from a rule-based stand-in after a short delay.
export function AskPanel({
  question,
  people,
  onAsk,
  onClose,
}: {
  question: string;
  people: Person[];
  onAsk: (question: string) => void;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ question: string; answer: AskAnswer } | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setResult({ question, answer: mockAnswer(question, people) }), 900);
    return () => window.clearTimeout(id);
  }, [question, people]);

  const answer = result?.question === question ? result.answer : null;
  const followUps = answer?.followUps.filter((f) => f.toLowerCase() !== question.toLowerCase()) ?? [];

  return (
    <section aria-live="polite" aria-busy={!answer} className="pt-2 pb-6">
      <button
        type="button"
        onClick={onClose}
        className="-ml-2 flex h-9 items-center gap-0.5 pr-2 text-sm font-medium text-primary"
      >
        <ChevronLeftIcon className="size-4" aria-hidden />
        All people
      </button>

      <p className="mt-2 flex items-start gap-2 text-sm font-medium text-muted-foreground">
        <SparklesIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        {question}
      </p>

      {!answer ? (
        <div className="mt-4 space-y-2.5" aria-label="Thinking">
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="mt-5 h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <p className="mt-3 text-lg leading-relaxed text-pretty">{answer.answer}</p>

          {answer.people.length > 0 && (
            <ul className="mt-4 divide-y border-y">
              {answer.people.map(({ person: p, reason }) => (
                <li key={p.id}>
                  <Link href={`/people/${p.id}`} className="flex items-center gap-3 py-3">
                    <PersonAvatar personId={p.id} name={p.full_name} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[1.0625rem] font-semibold tracking-tight">{p.full_name}</span>
                      {reason && <span className="block truncate text-sm text-muted-foreground">{reason}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {followUps.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {followUps.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onAsk(f)}
                  className="h-9 rounded-full border px-3.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            Answers come only from your own notes. Preview answers are simulated.
          </p>
        </>
      )}
    </section>
  );
}
