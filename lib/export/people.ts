// "Export everything" from Settings: every person as CSV (for a spreadsheet)
// or JSON (complete, for moving to another app). The same functions will run
// on the server over the signed-in user's rows. Recordings and photos are
// files in private storage and aren't included.
import { appConfig } from "@/lib/config";
import { monthName } from "@/lib/format";
import type { Encounter, Person, Task } from "@/lib/types";

export type ExportPerson = Person & { meetings: Encounter[]; tasks?: Task[] };

const KNOWN_EXTRAS = new Set(["email", "company", "role"]);

// "2026-10-04 19:30" in the zone the meeting happened in, so a spreadsheet
// sorts it and the time reads as it did on the day.
function localDateTime(iso: string, timeZone: string | null) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: timeZone ?? undefined,
  }).format(new Date(iso));
}

function birthday(p: Person) {
  if (!p.birthday_day || !p.birthday_month) return "";
  return [p.birthday_day, monthName(p.birthday_month), p.birthday_year].filter(Boolean).join(" ");
}

// A spreadsheet runs a cell that starts with = + - or @ as a formula, which a
// note could abuse. A leading apostrophe makes it plain text (Excel hides it).
function neutralise(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function cell(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const text = neutralise(String(value));
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const COLUMNS: [string, (p: ExportPerson) => string | number | null | undefined][] = [
  ["Name", (p) => p.full_name],
  ["Met", (p) => localDateTime(p.met_at, p.met_timezone)],
  ["Time zone", (p) => p.met_timezone],
  ["Where met (your words)", (p) => p.where_met_text],
  ["Place", (p) => p.place_name],
  ["City", (p) => p.city],
  ["Region", (p) => p.region],
  ["Country", (p) => p.country],
  ["Latitude", (p) => p.lat],
  ["Longitude", (p) => p.lng],
  ["Times met", (p) => Math.max(1, p.meetings.length)],
  ["Last met", (p) => {
    const last = p.meetings[0] ?? p;
    return localDateTime(last.met_at, last.met_timezone);
  }],
  ["Phone", (p) => p.phone],
  ["Email", (p) => p.extras.email],
  ["Company", (p) => p.extras.company],
  ["Role", (p) => p.extras.role],
  ["Birthday", birthday],
  ["Relationship", (p) => p.relationship && p.relationship[0].toUpperCase() + p.relationship.slice(1)],
  ["Tags", (p) => p.tags.join(", ")],
  ["Notes", (p) => p.notes],
  ["Follow-up", (p) => p.follow_up_note],
  ["Follow-up date", (p) => p.follow_up_date],
  ["Tasks", (p) => (p.tasks ?? []).map((t) => (t.due_date ? `${t.title} (due ${t.due_date})` : t.title)).join("; ")],
  ["Imported", (p) => p.imported_at ?? null],
  ["Other details", (p) =>
    Object.entries(p.extras)
      .filter(([key, value]) => value && !KNOWN_EXTRAS.has(key))
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
      .join("; ")],
  ["Added", (p) => p.created_at],
  ["Updated", (p) => p.updated_at],
];

// One row per person. Starts with a byte-order mark so Excel reads Arabic
// and Thai names as UTF-8, and uses CRLF line endings as RFC 4180 asks.
export function peopleToCsv(people: ExportPerson[]) {
  const rows = [COLUMNS.map(([header]) => cell(header)).join(",")];
  for (const p of people) rows.push(COLUMNS.map(([, read]) => cell(read(p))).join(","));
  return "﻿" + rows.join("\r\n") + "\r\n";
}

// Everything, including every meeting and its transcript, in a shape another
// app (or this one, later) can read back.
export function peopleToJson(people: ExportPerson[], now = new Date()) {
  return (
    JSON.stringify(
      {
        app: appConfig.name,
        format_version: 1,
        exported_at: now.toISOString(),
        note: "Recordings and photos are not included in this file.",
        people,
      },
      null,
      2,
    ) + "\n"
  );
}

export function exportFileName(format: "csv" | "json", now = new Date()) {
  const slug = appConfig.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const day = new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return `${slug}-people-${day}.${format}`;
}
