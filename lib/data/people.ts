import "server-only";
// Where the screens get people from: the signed-in user's rows in Supabase,
// or the sample people when accounts aren't connected (the preview).
// Row level security limits every query to the signed-in user.
import { normalizeExtraction } from "@/lib/ai/schema";
import { authConfigured } from "@/lib/auth/config";
import { audioUrl, CAPTURE_COLUMNS, type CaptureRow } from "@/lib/data/captures";
import { getMockMeetings, getMockPerson, mockLaterMeetings, mockPeople } from "@/lib/mock/people";
import { isPersonId } from "@/lib/people/validate";
import { createClient } from "@/lib/supabase/server";
import type { Encounter, Person } from "@/lib/types";

export const PERSON_COLUMNS =
  "id, full_name, met_at, met_timezone, lat, lng, location_accuracy_m, place_name, city, region, country, " +
  "where_met_text, phone, birthday_month, birthday_day, birthday_year, notes, follow_up_note, follow_up_date, " +
  "extras, relationship, tags, imported_at, created_at, updated_at";

export const usingSampleData = () => !authConfigured();

// Everyone the user has saved, most recently met first.
export async function listPeople(): Promise<Person[]> {
  if (usingSampleData()) return mockPeople;
  const supabase = await createClient();
  const { data, error } = await supabase.from("people").select(PERSON_COLUMNS).order("met_at", { ascending: false });
  if (error) throw new Error(`Could not load people (${error.code})`);
  return (data ?? []) as unknown as Person[];
}

export async function getPerson(id: string): Promise<Person | null> {
  if (usingSampleData()) return getMockPerson(id);
  if (!isPersonId(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("people").select(PERSON_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load this person (${error.code})`);
  return (data as unknown as Person | null) ?? null;
}

// The first meeting comes from the person themselves, with the recording of
// the note that created them, if there was one.
function firstMeeting(p: Person, note: CaptureRow | undefined, audio: string | null): Encounter {
  return {
    id: `first-${p.id}`,
    person_id: p.id,
    met_at: p.met_at,
    met_timezone: p.met_timezone,
    place_name: p.place_name,
    city: p.city,
    where_met_text: p.where_met_text,
    // The person's notes are shown separately on the profile.
    note: null,
    transcript: note?.transcript ?? null,
    duration_seconds: note?.duration_seconds ?? null,
    audio_url: audio,
  };
}

// A later meeting: a voice note added to someone already saved, or a "Met
// again" note typed on their profile (no audio; the text is the note).
function laterMeeting(row: CaptureRow, audio: string | null): Encounter {
  const recordedAt = row.recorded_at ?? row.created_at;
  const typed = !row.audio_path;
  const extraction = !typed && row.extraction ? normalizeExtraction(row.extraction, new Date(recordedAt)) : null;
  return {
    id: row.id,
    person_id: row.person_id!,
    met_at: recordedAt,
    met_timezone: row.recorded_timezone,
    place_name: row.geocode?.place_name ?? null,
    city: row.geocode?.city ?? null,
    where_met_text: extraction?.where_met_text ?? null,
    note: typed ? row.transcript : (extraction?.notes ?? null),
    transcript: typed ? null : row.transcript,
    duration_seconds: typed ? null : row.duration_seconds,
    audio_url: audio,
  };
}

// Every meeting with a person, newest first.
export async function listMeetings(person: Person): Promise<Encounter[]> {
  if (usingSampleData()) return getMockMeetings(person.id);
  const supabase = await createClient();
  const { data } = await supabase
    .from("captures")
    .select(CAPTURE_COLUMNS)
    .eq("person_id", person.id)
    .eq("status", "confirmed")
    .order("recorded_at", { ascending: false });
  const rows = (data ?? []) as unknown as CaptureRow[];
  const first = rows.find((r) => r.first_meeting);
  const later = rows.filter((r) => !r.first_meeting);
  const urls = await Promise.all(rows.map((r) => audioUrl(supabase, r.audio_path)));
  const urlFor = (row: CaptureRow | undefined) => (row ? (urls[rows.indexOf(row)] ?? null) : null);
  // Someone imported from contacts has no first meeting until one is recorded.
  const opening = person.imported_at && !first ? [] : [firstMeeting(person, first, urlFor(first))];
  return [...later.map((r) => laterMeeting(r, urlFor(r))), ...opening].sort((a, b) => b.met_at.localeCompare(a.met_at));
}

// Meetings after the first, for every person (the map's trip mode).
export async function listLaterMeetings(): Promise<Encounter[]> {
  if (usingSampleData()) return mockLaterMeetings;
  const supabase = await createClient();
  const { data } = await supabase
    .from("captures")
    .select(CAPTURE_COLUMNS)
    .not("person_id", "is", null)
    .eq("status", "confirmed")
    .eq("first_meeting", false);
  return ((data ?? []) as unknown as CaptureRow[]).map((row) => laterMeeting(row, null));
}
