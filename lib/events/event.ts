// Event mode: at a busy event every tap of the mic saves a quick take (a
// name and one detail) with nothing to review until the event is over.
// Real build: an `events` row per event (ended_at null while it runs) and
// captures.event_id on each take; the takes go through the normal pipeline
// in the background and wait in "needs review".
import type { Draft } from "@/lib/types";

export type TakeOutcome = "saved" | "discarded";

export type Take = {
  captureId: string;
  recordedAt: string;
  durationSeconds: number;
  // What the pipeline made of it (in the mockup, a sample, known up front).
  draft: Draft;
  // When the draft is ready to review; null while the take waits on the phone to be sent.
  readyAt: string | null;
  outcome: TakeOutcome | null;
  // With accounts connected: the server has processed it and `draft` is real.
  processed?: boolean;
};

export type EventSession = {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  takes: Take[];
};

export type TakeStatus = "waiting" | "processing" | "ready" | TakeOutcome;

export function takeStatus(take: Take, now = Date.now()): TakeStatus {
  if (take.outcome) return take.outcome;
  if (!take.readyAt) return "waiting";
  return Date.parse(take.readyAt) > now ? "processing" : "ready";
}

// Takes that still need a decision (saved or discarded).
export function openTakes(event: EventSession | null) {
  return event?.takes.filter((take) => !take.outcome) ?? [];
}

export const isLive = (event: EventSession | null): event is EventSession => Boolean(event && !event.endedAt);

// A name for an event started without one: "Friday evening". Just after
// midnight still counts as the night before, the way people say it.
export function defaultEventName(now = new Date(), timeZone?: string) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone }).format(now));
  const day = hour < 5 ? new Date(now.getTime() - 5 * 60 * 60 * 1000) : now;
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone }).format(day);
  const part = hour < 5 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 22 ? "evening" : "night";
  return `${weekday} ${part}`;
}

// The line under a take's name: what the AI picked out, kept short.
export function takeDetail(draft: Draft) {
  const p = draft.person;
  const detail = p.notes ?? p.extras.role ?? p.where_met_text ?? "";
  return detail.length > 90 ? `${detail.slice(0, 87).trimEnd()}…` : detail;
}
