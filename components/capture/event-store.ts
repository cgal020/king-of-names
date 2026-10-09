"use client";

import { useSyncExternalStore } from "react";
import type { EventSession, Take, TakeOutcome } from "@/lib/events/event";
import { authConfigured } from "@/lib/auth/config";
import type { Draft } from "@/lib/types";

// The current event and its takes. An event lasts hours and the app gets
// closed in between, so it's kept in the browser. Mockup only: the real app
// reads the open event and its takes from the database.
const KEY = "king-of-names:event";
// How long the mockup "pipeline" takes once a take reaches the server.
export const MOCK_PROCESSING_MS = 2_500;
// With accounts connected a take shows as processing until the server's
// draft arrives (setDraft); this is only how long it may claim to.
const REAL_PROCESSING_MS = 10 * 60_000;

let current: EventSession | null | undefined;
const listeners = new Set<() => void>();
// Playback for takes recorded in this session; blob URLs don't survive a reload.
const audio = new Map<string, string>();

function read(): EventSession | null {
  if (current === undefined) {
    try {
      current = JSON.parse(localStorage.getItem(KEY) ?? "null");
    } catch {
      current = null;
    }
  }
  return current ?? null;
}

function write(next: EventSession | null) {
  current = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode: the event lasts until the page closes.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    current = undefined;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const updateTakes = (fn: (takes: Take[]) => Take[]) => {
  const event = read();
  if (event) write({ ...event, takes: fn(event.takes) });
};

export const eventActions = {
  start(name: string) {
    write({ id: crypto.randomUUID(), name, startedAt: new Date().toISOString(), endedAt: null, takes: [] });
  },
  end() {
    const event = read();
    if (event && !event.endedAt) write({ ...event, endedAt: new Date().toISOString() });
  },
  // Done with the event: every take is saved or discarded.
  close() {
    audio.forEach((url) => URL.revokeObjectURL(url));
    audio.clear();
    write(null);
  },
  addTake(take: Take, audioUrl?: string) {
    if (audioUrl) audio.set(take.captureId, audioUrl);
    updateTakes((takes) => [...takes, take]);
  },
  // The take reached the server; its draft is ready shortly after.
  markSent(captureId: string, now = Date.now()) {
    const wait = authConfigured() ? REAL_PROCESSING_MS : MOCK_PROCESSING_MS;
    updateTakes((takes) =>
      takes.map((t) => (t.captureId === captureId && !t.readyAt ? { ...t, readyAt: new Date(now + wait).toISOString() } : t)),
    );
  },
  // The server's draft for a take: its name and details are now real.
  setDraft(captureId: string, draft: Draft, now = Date.now()) {
    updateTakes((takes) =>
      takes.map((t) => (t.captureId === captureId ? { ...t, draft, processed: true, readyAt: new Date(now).toISOString() } : t)),
    );
  },
  decide(captureId: string, outcome: TakeOutcome) {
    updateTakes((takes) => takes.map((t) => (t.captureId === captureId ? { ...t, outcome } : t)));
  },
};

// The event as it stands right now, for event handlers that run after awaits.
export function currentEvent() {
  return read();
}

export function takeAudio(captureId: string) {
  return audio.get(captureId) ?? null;
}

export function useEventSession() {
  return useSyncExternalStore(subscribe, read, () => null);
}
