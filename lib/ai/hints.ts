// Transcription hints. The prompt tells the model what kind of recording this
// is; keywords are words it should expect to hear, which is the main lever for
// spelling names right (Arabic and Thai names in English speech especially).
import type { Person } from "@/lib/types";

export const TRANSCRIPTION_PROMPT =
  "A quick voice note recorded right after meeting someone. It names the person and often their company, " +
  "the venue or city, a phone number, a birthday and something to follow up on. Names may be Arabic, Thai, " +
  "Filipino, European or Australian.";

const MAX_KEYWORDS = 60;

// Names, companies, places and tags from the user's own people, most recent
// first, deduplicated and capped. Sent only to the transcription provider.
export function transcriptionKeywords(people: Pick<Person, "full_name" | "met_at" | "city" | "place_name" | "extras" | "tags">[]) {
  const seen = new Set<string>();
  const keywords: string[] = [];
  const add = (value: string | null | undefined) => {
    const v = value?.replace(/[“”"]/g, "").trim();
    if (!v || v.length < 2 || v.length > 40) return;
    const key = v.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    keywords.push(v);
  };
  const recent = [...people].sort((a, b) => b.met_at.localeCompare(a.met_at));
  for (const p of recent) add(p.full_name);
  for (const p of recent) add(p.extras.company);
  for (const p of recent) {
    add(p.place_name);
    add(p.city);
  }
  for (const p of recent) p.tags.forEach(add);
  return keywords.slice(0, MAX_KEYWORDS);
}

// File name the transcription API uses to recognise the format.
export function audioFileName(mime: string) {
  const base = mime.split(";")[0].trim().toLowerCase();
  const ext: Record<string, string> = {
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/aac": "m4a",
    "audio/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
  };
  return ext[base] ? `note.${ext[base]}` : null;
}
