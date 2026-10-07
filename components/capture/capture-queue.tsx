"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CloudUploadIcon } from "lucide-react";
import { flushQueue, indexedDbStore, type QueuedCapture } from "@/lib/offline/queue";

const UPLOAD_TIMEOUT_MS = 15_000;
const RETRY_MS = 30_000;

// Sends one recording. Throws when it can’t be sent, and the caller keeps it
// in the queue. A weak signal often still reports navigator.onLine, so a
// failed or slow request is what counts, not that flag.
// Mockup: a request to the site stands in for the real POST to /api/captures,
// which takes the capture id from the phone so a retry never makes a second
// capture.
export async function uploadCapture(item: QueuedCapture) {
  void item;
  if (!navigator.onLine) throw new TypeError("Offline");
  const response = await fetch("/manifest.webmanifest", {
    method: "HEAD",
    cache: "no-store",
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
  await new Promise((resolve) => setTimeout(resolve, 500));
}

let store: ReturnType<typeof indexedDbStore> | null = null;
const queueStore = () => (store ??= indexedDbStore());

// Waiting recordings: count, save, and send when the app opens, comes back
// online or becomes visible again, and every 30 seconds while any wait.
export function useCaptureQueue() {
  const [waiting, setWaiting] = useState(0);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    setWaiting((await queueStore().all()).length);
  }, []);

  const send = useCallback(async () => {
    if (!navigator.onLine) return;
    const items = await queueStore().all();
    if (!items.length) return;
    setSending(true);
    const { sent, waiting: left } = await flushQueue(queueStore(), uploadCapture);
    setSending(false);
    setWaiting(left);
    if (sent) toast.success(sent === 1 ? "Waiting note sent" : `${sent} waiting notes sent`);
  }, []);

  const save = useCallback(
    async (item: QueuedCapture) => {
      await queueStore().put(item);
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

  return { waiting, sending, save, send };
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
