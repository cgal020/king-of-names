"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SparklesIcon } from "lucide-react";
import { PersonAvatar } from "@/components/photos/person-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { authConfigured } from "@/lib/auth/config";
import { mockAnswer, type AskAnswer as Answer } from "@/lib/mock/ask";
import type { Person } from "@/lib/types";

type Turn = { question: string; answer: string };
type Reply = { answer: string; people: { id: string; reason: string }[]; followUps: string[] };

// One question and its answer, citing the people it drew on. Claude answers
// from the user's own people (the server checks every person it cites); the
// preview uses a rule-based stand-in.
export function AskAnswer({
  question,
  people,
  history,
  onAsk,
  onAnswered,
}: {
  question: string;
  people: Person[];
  // Earlier questions and answers in this thread, for follow-ups.
  history: Turn[];
  onAsk: (question: string) => void;
  onAnswered: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // The thread as it was when this question was asked.
  const [context] = useState(history);

  useEffect(() => {
    if (!authConfigured()) {
      const id = window.setTimeout(() => setAnswer(mockAnswer(question, people)), 900);
      return () => window.clearTimeout(id);
    }
    const controller = new AbortController();
    fetch("/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, history: context, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const reply: Reply = await response.json();
        const byId = new Map(people.map((p) => [p.id, p]));
        setAnswer({
          answer: reply.answer,
          people: reply.people.flatMap(({ id, reason }) => {
            const person = byId.get(id);
            return person ? [{ person, reason }] : [];
          }),
          followUps: reply.followUps,
        });
        onAnswered(reply.answer);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
    // One request per question (and per retry); the answer callback can change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, people, attempt]);

  const followUps = answer?.followUps.filter((f) => f.toLowerCase() !== question.toLowerCase()) ?? [];

  return (
    <article aria-busy={!answer} className="py-5">
      <p className="flex items-start gap-2 text-[0.95rem] font-medium text-muted-foreground">
        <SparklesIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        {question}
      </p>

      {failed && !answer ? (
        <div className="mt-3 flex flex-col items-start gap-2">
          <p className="text-[1.0625rem] text-muted-foreground">Couldn’t answer that right now.</p>
          <Button
            variant="outline"
            className="h-9 rounded-xl px-3.5"
            onClick={() => {
              setFailed(false);
              setAttempt((a) => a + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : !answer ? (
        <div className="mt-4 space-y-2.5" aria-label="Thinking">
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="mt-5 h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-pretty">{answer.answer}</p>

          {answer.people.length > 0 && (
            <ul className="mt-4 divide-y rounded-3xl bg-card px-4 shadow-card">
              {answer.people.map(({ person: p, reason }) => (
                <li key={p.id}>
                  <Link href={`/people/${p.id}`} className="flex items-center gap-3 py-3">
                    <PersonAvatar personId={p.id} name={p.full_name} size={36} />
                    <span className="min-w-0 flex-1">
                      <bdi dir="auto" className="type-name-list block truncate">{p.full_name}</bdi>
                      {reason && <span className="block truncate text-sm text-muted-foreground">{reason}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {followUps.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {followUps.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onAsk(f)}
                  className="h-9 rounded-full border border-border px-3.5 text-[0.9375rem] transition-[transform,background-color] duration-120 hover:bg-muted active:scale-[0.97]"
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  );
}
