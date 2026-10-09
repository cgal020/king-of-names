// What People search looks through: everything you'd remember someone by.
// Name, notes, where you met and the place (with the names people use for
// it), company, role, email, tags, the follow-up, and what you noted when you
// met again. Phone numbers match by digits, so "0917" finds +63 917.
import { placeAliases } from "@/lib/geo/places";
import type { Encounter, Person } from "@/lib/types";

// Case- and accent-insensitive, so "jose" finds "José".
export const fold = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

export type SearchEntry = { text: string; digits: string };

export function searchEntry(person: Person, laterMeetings: Encounter[] = []): SearchEntry {
  const later = laterMeetings.filter((m) => m.person_id === person.id);
  const places = [person.place_name, person.city, person.region, person.country, ...later.flatMap((m) => [m.place_name, m.city])];
  const text = [
    person.full_name,
    person.notes,
    person.where_met_text,
    ...places,
    ...placeAliases(...places),
    ...Object.values(person.extras),
    ...person.tags,
    person.follow_up_note,
    ...later.flatMap((m) => [m.note, m.where_met_text]),
  ]
    .filter(Boolean)
    .join(" ");
  return { text: fold(text), digits: (person.phone ?? "").replace(/\D/g, "") };
}

// A phone number, typed with or without spaces, dashes or a leading 0.
function matchesPhone(entry: SearchEntry, typed: string) {
  const digits = typed.replace(/[\s+().-]/g, "");
  if (!/^\d{3,}$/.test(digits) || !entry.digits) return false;
  return entry.digits.includes(digits) || (digits.startsWith("0") && entry.digits.includes(digits.slice(1)));
}

export function matchesSearch(entry: SearchEntry, query: string): boolean {
  // "+63 917-555-0142" is one number, not three words.
  if (/^[\d\s+().-]+$/.test(query.trim()) && matchesPhone(entry, query)) return true;
  const terms = fold(query).split(/\s+/).filter(Boolean);
  return terms.every((term) => entry.text.includes(term) || matchesPhone(entry, term));
}
