// What the extraction model returns for one voice note, and the clean-up that
// turns it into a safe draft. The schema is sent to the model as a structured
// output format; normalizeExtraction() then checks what Zod can't express.
import { z } from "zod";
import { normalizePhone } from "@/lib/cards/parse-qr";
import { addTag } from "@/lib/tags";

const text = z.string().nullable();

export const ExtractionSchema = z.object({
  full_name: text.describe("The main person's name as spoken, or null if no name was said."),
  where_met_text: text.describe("Where they met, in the speaker's own words, or null."),
  phone: text.describe("Phone number as spoken, digits only plus a leading + if said, or null."),
  birthday: z.object({
    month: z.number().int().nullable(),
    day: z.number().int().nullable(),
    year: z.number().int().nullable(),
  }),
  notes: text.describe("A short, clean rewrite of what is worth remembering. Not a copy of the transcript."),
  follow_up: z.object({
    note: text.describe("What the speaker wants to be reminded to do, or null."),
    date: text.describe("YYYY-MM-DD resolved from the recording date, or null if no date was given."),
  }),
  extras: z.object({
    email: text,
    company: text,
    role: text,
    website: text,
    linkedin: text,
  }),
  other_details: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .describe("Anything else concrete that was said and doesn't fit a field, e.g. Instagram handle."),
  additional_people: z.array(z.string()).describe("Other people named who may deserve their own entry."),
  relationship: z
    .enum(["business", "personal", "both"])
    .nullable()
    .describe("Business, personal or both, only if the note makes it clear; otherwise null."),
  suggested_tags: z
    .array(z.string())
    .describe("Up to 4 short tags for how this person could help, e.g. Investor, Partner, Logistics."),
  confidence: z.object({
    full_name: z.enum(["high", "medium", "low"]),
  }),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

// A clean, validated extraction with every gap set to null.
export type CleanExtraction = {
  full_name: string | null;
  where_met_text: string | null;
  phone: string | null;
  birthday: { month: number | null; day: number | null; year: number | null };
  notes: string | null;
  follow_up: { note: string | null; date: string | null };
  extras: Record<string, string>;
  additional_people: string[];
  relationship: "business" | "personal" | "both" | null;
  tags: string[];
  name_confidence: "high" | "medium" | "low";
};

const MAX_TAGS = 4;

function clean(value: string | null | undefined) {
  const v = value?.trim();
  return v ? v : null;
}

function validDate(iso: string | null) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toISOString().slice(0, 10) === iso ? iso : null;
}

function validBirthday(b: Extraction["birthday"], today: Date) {
  const month = b.month && b.month >= 1 && b.month <= 12 ? b.month : null;
  const daysInMonth = month ? new Date(Date.UTC(2024, month, 0)).getUTCDate() : 31; // 2024: allow 29 Feb
  const day = month && b.day && b.day >= 1 && b.day <= daysInMonth ? b.day : null;
  const year = month && b.year && b.year >= 1900 && b.year <= today.getFullYear() ? b.year : null;
  return { month, day: month ? day : null, year };
}

// Parses the model's JSON (already schema-shaped) and enforces the rules the
// schema can't: real dates, sane birthdays, light phone clean-up, tidy tags.
export function normalizeExtraction(raw: unknown, today = new Date()): CleanExtraction {
  const e = ExtractionSchema.parse(raw);
  const fullName = clean(e.full_name);

  const extras: Record<string, string> = {};
  for (const [key, value] of Object.entries(e.extras)) {
    const v = clean(value);
    if (v) extras[key] = v;
  }
  for (const { label, value } of e.other_details) {
    const key = clean(label)?.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const v = clean(value);
    if (key && v && !(key in extras)) extras[key] = v;
  }

  let tags: string[] = [];
  for (const tag of e.suggested_tags) tags = addTag(tags, tag);

  const phone = clean(e.phone);
  return {
    full_name: fullName,
    where_met_text: clean(e.where_met_text),
    phone: phone ? normalizePhone(phone) || null : null,
    birthday: validBirthday(e.birthday, today),
    notes: clean(e.notes),
    follow_up: { note: clean(e.follow_up.note), date: validDate(clean(e.follow_up.date)) },
    extras,
    additional_people: [...new Set(e.additional_people.map((n) => n.trim()).filter((n) => n && n !== fullName))],
    relationship: e.relationship,
    tags: tags.slice(0, MAX_TAGS),
    // A missing name can't be "high" confidence.
    name_confidence: fullName ? e.confidence.full_name : "low",
  };
}
