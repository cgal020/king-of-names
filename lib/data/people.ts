import "server-only";
// Where the screens get people from: the signed-in user's rows in Supabase,
// or the sample people when accounts aren't connected (the preview).
// Row level security limits every query to the signed-in user.
import { authConfigured } from "@/lib/auth/config";
import { getMockMeetings, getMockPerson, mockLaterMeetings, mockPeople } from "@/lib/mock/people";
import { isPersonId } from "@/lib/people/validate";
import { createClient } from "@/lib/supabase/server";
import type { Encounter, Person } from "@/lib/types";

export const PERSON_COLUMNS =
  "id, full_name, met_at, met_timezone, lat, lng, location_accuracy_m, place_name, city, region, country, " +
  "where_met_text, phone, birthday_month, birthday_day, birthday_year, notes, follow_up_note, follow_up_date, " +
  "extras, relationship, tags, created_at, updated_at";

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

// The first meeting comes from the person themselves.
function firstMeeting(p: Person): Encounter {
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
    transcript: null,
    duration_seconds: null,
  };
}

// Every meeting with a person, newest first. Later meetings arrive with
// voice notes, so until those are connected a saved person has one meeting.
export async function listMeetings(person: Person): Promise<Encounter[]> {
  if (usingSampleData()) return getMockMeetings(person.id);
  return [firstMeeting(person)];
}

// Meetings after the first, for every person (the map's trip mode).
export async function listLaterMeetings(): Promise<Encounter[]> {
  if (usingSampleData()) return mockLaterMeetings;
  return [];
}
