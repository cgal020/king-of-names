"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { CircleAlertIcon, CloudUploadIcon } from "lucide-react";
import { eventActions } from "@/components/capture/event-store";
import { ConfirmButton } from "@/components/confirm-button";
import { authConfigured } from "@/lib/auth/config";
import type { PipelineStep } from "@/lib/pipeline/process-capture";
import type { Draft } from "@/lib/types";
import {
  classifyUploadStatus,
  flushQueue,
  indexedDbStore,
  isSending,
  UploadRateLimited,
  UploadRejected,
  type QueuedCapture,
} from "@/lib/offline/queue";

const UPLOAD_TIMEOUT_MS = 15_000;
const RETRY_MS = 30_000;

// Sends one recording. Throws when it can’t be sent, and the caller keeps it
// in the queue: UploadRejected when the server refuses the note itself, any
// other error when trying again later may work. A weak signal often still
// reports navigator.onLine, so a failed or slow request is what counts.
// POST /api/captures takes the capture id from the phone, so a retry never
// makes a second capture, and answers a refusal with { error: "<reason>" }.
// The preview, with no accounts, sends a small request to the site instead.
export async function uploadCapture(item: QueuedCapture) {
  if (!navigator.onLine) throw new TypeError("Offline");
  const signal = AbortSignal.timeout(UPLOAD_TIMEOUT_MS);
  let response: Response;
  if (authConfigured()) {
    const form = new FormData();
    form.set("audio", item.audio, `${item.id}`);
    form.set("id", item.id);
    form.set("duration_seconds", String(Math.round(item.durationSeconds * 10) / 10));
    form.set("recorded_at", item.recordedAt);
    if (item.timezone) form.set("timezone", item.timezone);
    if (item.location) {
      form.set("lat", String(item.location.lat));
      form.set("lng", String(item.location.lng));
      if (item.location.accuracyM !== null) form.set("accuracy_m", String(item.location.accuracyM));
    }
    if (item.eventId) form.set("event_id", item.eventId);
    response = await fetch("/api/captures", { method: "POST", body: form, signal });
  } else {
    response = await fetch("/manifest.webmanifest", { method: "HEAD", cache: "no-store", signal });
  }
  const outcome = classifyUploadStatus(response.status);
  if (outcome === "rejected") {
    const body = await response.json().catch(() => null);
    throw new UploadRejected(body?.error ?? "The note couldn’t be sent.");
  }
  if (response.status === 429) throw new UploadRateLimited(Number(response.headers.get("retry-after")) || 600);
  if (outcome === "retry") throw new Error(`Upload failed (${response.status})`);
  if (!authConfigured()) await new Promise((resolve) => setTimeout(resolve, 500));
}

// Runs a sent note through transcription and extraction. Resolves when the
// draft is ready (or the steps that failed are known); throws if the server
// couldn't be reached, and the note can be processed later from Review.
export async function processCapture(id: string): Promise<{ status: string; failedSteps: string[]; draft: Draft | null }> {
  const response = await fetch(`/api/captures/${id}/process`, { method: "POST", signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Processing failed (${response.status})`);
  return response.json();
}

// The same, reporting each step as the server finishes it (one JSON line per
// step, then the result), so Capture shows real progress.
export async function processCaptureLive(
  id: string,
  onStep: (step: PipelineStep, ok: boolean) => void,
): Promise<{ status: string; failedSteps: string[]; draft: Draft | null }> {
  const response = await fetch(`/api/captures/${id}/process`, {
    method: "POST",
    headers: { accept: "application/x-ndjson" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok || !response.body) throw new Error(`Processing failed (${response.status})`);
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end: number;
    while ((end = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      if (message.step) onStep(message.step, Boolean(message.ok));
      else if (message.result) return message.result;
      else if (message.error) throw new Error(message.error);
    }
  }
  throw new Error("Processing ended early");
}

let store: ReturnType<typeof indexedDbStore> | null = null;
const queueStore = () => (store ??= indexedDbStore());

type RejectedNote = { id: string; reason: string };

// Waiting recordings: count, save, and send when the app opens, comes back
// online or becomes visible again, and every 30 seconds while any wait.
function useQueueEngine() {
  const [waiting, setWaiting] = useState(0);
  // Waiting plus any cut off mid-upload, which need the retry timer too.
  const [pending, setPending] = useState(0);
  const [rejected, setRejected] = useState<RejectedNote[]>([]);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    const items = await queueStore().all();
    setWaiting(items.filter((item) => !item.rejected && !isSending(item)).length);
    setPending(items.filter((item) => !item.rejected).length);
    setRejected(items.flatMap((item) => (item.rejected ? [{ id: item.id, reason: item.rejected }] : [])));
  }, []);

  const send = useCallback(async () => {
    if (!navigator.onLine) return;
    const items = await queueStore().all();
    if (!items.some((item) => !item.rejected && !isSending(item))) return;
    setSending(true);
    const before = items.filter((item) => item.rejected).length;
    const result = await flushQueue(queueStore(), async (item) => {
      await uploadCapture(item);
      // An event take that waited on the phone is now on its way to review.
      eventActions.markSent(item.id);
      // Read it now, so it waits on the review strip (or the takes list) with a name.
      if (authConfigured()) {
        void processCapture(item.id)
          .then(({ draft }) => draft && eventActions.setDraft(item.id, draft))
          .catch(() => {});
      }
    });
    setSending(false);
    await refresh();
    if (result.sent) toast.success(result.sent === 1 ? "Waiting note sent" : `${result.sent} waiting notes sent`);
    if (result.rejected > before) toast.error("A waiting note couldn’t be sent");
  }, [refresh]);

  const save = useCallback(
    async (item: QueuedCapture) => {
      await queueStore().put(item);
      await refresh();
    },
    [refresh],
  );

  // Sends a new note: written to the phone first, removed once the server has
  // it, kept (and shown as waiting or refused) if it can't be sent.
  const sendNew = useCallback(
    async (
      item: QueuedCapture,
    ): Promise<{ ok: true } | { ok: false; refused: string | null; retryAfterSeconds: number | null }> => {
      const sendingUntil = new Date(Date.now() + UPLOAD_TIMEOUT_MS + 5_000).toISOString();
      await queueStore().put({ ...item, sendingUntil });
      try {
        await uploadCapture(item);
        await queueStore().remove(item.id);
        return { ok: true };
      } catch (error) {
        const refused = error instanceof UploadRejected ? error.message : null;
        await queueStore().put({
          ...item,
          attempts: 1,
          lastError: error instanceof Error ? error.name : "Error",
          ...(refused && { rejected: refused }),
        });
        await refresh();
        return { ok: false, refused, retryAfterSeconds: error instanceof UploadRateLimited ? error.retryAfterSeconds : null };
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await queueStore().remove(id);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    const kick = () => void refresh().then(send);
    const onVisible = () => document.visibilityState === "visible" && kick();
    kick();
    window.addEventListener("online", kick);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", kick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, send]);

  // A weak signal that recovers fires no "online" event, so keep trying while
  // notes are waiting and the app is on screen.
  useEffect(() => {
    if (!pending) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void send();
    }, RETRY_MS);
    return () => window.clearInterval(id);
  }, [pending, send]);

  return { waiting, rejected, sending, save, send, sendNew, remove };
}

type CaptureQueue = ReturnType<typeof useQueueEngine>;
const QueueContext = createContext<CaptureQueue | null>(null);

// Runs the queue for the whole app, so waiting notes go out from any screen,
// not only while Capture is open.
export function CaptureQueueProvider({ children }: { children: React.ReactNode }) {
  return <QueueContext.Provider value={useQueueEngine()}>{children}</QueueContext.Provider>;
}

export function useCaptureQueue() {
  const queue = useContext(QueueContext);
  if (!queue) throw new Error("useCaptureQueue must be used inside CaptureQueueProvider");
  return queue;
}

export function WaitingToSend({ waiting, sending, onSend }: { waiting: number; sending: boolean; onSend: () => void }) {
  if (!waiting) return null;
  return (
    <div className="mt-2.5 flex min-h-14 items-center gap-3 rounded-2xl bg-muted px-3.5 py-3">
      <CloudUploadIcon className={sending ? "size-5 animate-blink text-primary" : "size-5 text-muted-foreground"} aria-hidden />
      <span className="min-w-0 flex-1 text-sm">
        <span className="block text-[0.9375rem] font-semibold">
          {waiting === 1 ? "1 note waiting to send" : `${waiting} notes waiting to send`}
        </span>
        <span className="block text-muted-foreground">Saved on this phone. Sends when you&rsquo;re online.</span>
      </span>
      <button
        type="button"
        onClick={onSend}
        disabled={sending}
        className="h-11 shrink-0 rounded-lg px-2 text-[0.9375rem] font-semibold text-primary disabled:opacity-40"
      >
        {sending ? "Sending…" : "Send now"}
      </button>
    </div>
  );
}

// Notes the server refused for good. They stay on the phone so nothing is lost
// silently, and the user decides when to remove them.
export function CouldNotSend({ notes, onRemove }: { notes: RejectedNote[]; onRemove: (id: string) => void }) {
  return notes.map((note) => (
    <div key={note.id} className="mt-2.5 flex min-h-14 items-center gap-3 rounded-2xl bg-destructive-soft px-3.5 py-3">
      <CircleAlertIcon className="size-5 shrink-0 text-destructive" aria-hidden />
      <span className="min-w-0 flex-1 text-sm">
        <span className="block text-[0.9375rem] font-semibold text-destructive">This note couldn&rsquo;t be sent</span>
        <span className="block text-foreground">{note.reason}</span>
      </span>
      <ConfirmButton
        label="Remove"
        title="Remove this note?"
        description="The recording is deleted from this phone. This can’t be undone."
        confirmLabel="Remove"
        variant="ghost"
        className="h-11 shrink-0 px-2 text-[0.9375rem] font-semibold text-foreground underline underline-offset-3"
        onConfirm={() => onRemove(note.id)}
      />
    </div>
  ));
}
