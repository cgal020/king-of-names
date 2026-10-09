// Other people a voice note names ("met Daniel and his partner Rosa"). Review
// offers to save each as their own person, alongside the one the note is
// about: the same time and place, and a note saying where they came from.
// Nothing else is assumed about them.
import type { PersonInput } from "@/lib/people/validate";

const MAX_MENTIONED = 5;

// The names worth offering: trimmed, each once, never the main person.
export function cleanMentions(names: unknown, mainName: string): string[] {
  if (!Array.isArray(names)) return [];
  const main = mainName.trim().toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    if (typeof raw !== "string") continue;
    const name = raw.trim().replace(/\s+/g, " ");
    const key = name.toLowerCase();
    if (!name || name.length > 120 || key === main || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.slice(0, MAX_MENTIONED);
}

export function mentionedPerson(name: string, main: PersonInput): PersonInput {
  return {
    full_name: name,
    met_at: main.met_at,
    met_timezone: main.met_timezone,
    lat: main.lat,
    lng: main.lng,
    location_accuracy_m: main.location_accuracy_m,
    place_name: main.place_name,
    city: main.city,
    region: main.region,
    country: main.country,
    where_met_text: main.where_met_text,
    phone: null,
    birthday_month: null,
    birthday_day: null,
    birthday_year: null,
    notes: `Mentioned in your note about ${main.full_name}.`,
    follow_up_note: null,
    follow_up_date: null,
    extras: {},
    relationship: null,
    tags: [],
  };
}
