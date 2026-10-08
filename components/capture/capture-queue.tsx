"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CircleAlertIcon, CloudUploadIcon } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import {
  classifyUploadStatus,
  flushQueue,
  indexedDbStore,
  UploadRejected,
  type QueuedCapture,
} from "@/lib/offline/queue";

const UPLOAD_TIMEOUT_MS = 15_000;
const RETRY_MS = 30_000;

// Sends one recording. Throws when it can’t be sent, and the caller keeps it
// in the queue: UploadRejected when the server refuses the note itself, any
// other error when trying again later may work. A weak signal often still
// reports navigator.onLine, so a failed or slow request is what counts.
// Mockup: a request to the site stands in for the real POST to /api/captures,
// which takes the capture id from the phone so a retry never makes a second
// capture, and answers a refusal with { error: "<reason>" }.
export async function uploadCapture(item: QueuedCapture) {
  void item;
  if (!navigator.onLine) throw new TypeError("Offline");
  const response = await fetch("/manifest.webmanifest", {
    method: "HEAD",
    cache: "no-store",
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });
  const outcome = classifyUploadStatus(response.status);
  if (outcome === "rejected") {
    const body = await response.json().catch(() => null);
    throw new UploadRejected(body?.error ?? "The note couldn’t be sent.");
  }
  if (outcome === "retry") throw new Error(`Upload failed (${response.status})`);
  await new Promise((resolve) => setTimeout(resolve, 500));
}

let store: ReturnType<typeof indexedDbStore> | null = null;
const queueStore = () => (store ??= indexedDbStore());

type RejectedNote = { id: string; reason: string };

// Waiting recordings: count, save, and send when the app opens, comes back
// online or becomes visible again, and every 30 seconds while any wait.
export function useCaptureQueue() {
  const [waiting, setWaiting] = useState(0);
  const [rejected, setRejected] = useState<RejectedNote[]>([]);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    const items = await queueStore().all();
    setWaiting(items.filter((item) => !item.rejected).length);
    setRejected(items.flatMap((item) => (item.rejected ? [{ id: item.id, reason: item.rejected }] : [])));
  }, []);

  const send = useCallback(async () => {
    if (!navigator.onLine) return;
    const items = await queueStore().all();
    if (!items.some((item) => !item.rejected)) return;
    setSending(true);
    const before = items.filter((item) => item.rejected).length;
    const result = await flushQueue(queueStore(), uploadCapture);
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
    if (!waiting) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void send();
    }, RETRY_MS);
    return () => window.clearInterval(id);
  }, [waiting, send]);

  return { waiting, rejected, sending, save, send, remove };
}

export function WaitingToSend({ waiting, sending, onSend }: { waiting: number; sending: boolean; onSend: () => void }) {
  if (!waiting) return null;
  return (
    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-dashed px-4 py-3">
      <CloudUploadIcon className={sending ? "size-5 animate-pulse text-primary" : "size-5 text-muted-foreground"} aria-hidden />
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-medium">
          {waiting === 1 ? "1 note waiting to send" : `${waiting} notes waiting to send`}
        </span>
        <span className="block text-muted-foreground">Saved on this phone. Sends when you&rsquo;re online.</span>
      </span>
      <button
        type="button"
        onClick={onSend}
        disabled={sending}
        className="h-9 shrink-0 rounded-lg px-2 text-sm font-medium text-primary disabled:opacity-50"
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
    <div key={note.id} className="mt-2 flex items-center gap-3 rounded-2xl border border-destructive/40 px-4 py-3">
      <CircleAlertIcon className="size-5 shrink-0 text-destructive" aria-hidden />
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-medium">This note couldn&rsquo;t be sent</span>
        <span className="block text-muted-foreground">{note.reason}</span>
      </span>
      <ConfirmButton
        label="Remove"
        title="Remove this note?"
        description="The recording is deleted from this phone. This can’t be undone."
        confirmLabel="Remove"
        variant="ghost"
        className="h-9 shrink-0 px-2 text-sm text-destructive"
        onConfirm={() => onRemove(note.id)}
      />
    </div>
  ));
}
