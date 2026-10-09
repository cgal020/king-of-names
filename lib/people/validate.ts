// What a saved person may contain, checked on the server before anything
// reaches the database. Mirrors the checks on the `people` table, and tidies
// what people type: trimmed text, empty fields as null, tags deduplicated.
import { z } from "zod";
import { addTag } from "@/lib/tags";

// Optional text: trimmed, and an empty box is stored as null.
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer.`)
    .nullish()
    .transform((v) => v || null);

const isTimeZone = (zone: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const PersonInputSchema = z
  .object({
    full_name: z.string().trim().min(1, "Add their name.").max(120, "Use 120 characters or fewer."),
    met_at: z.iso.datetime({ offset: true, message: "Choose when you met." }),
    met_timezone: z.string().refine(isTimeZone, "Unknown time zone.").nullish().transform((v) => v ?? null),
    lat: z.number().min(-90).max(90).nullable(),
    lng: z.number().min(-180).max(180).nullable(),
    location_accuracy_m: z.number().min(0).max(100_000).nullable(),
    place_name: text(160),
    city: text(120),
    region: text(120),
    country: text(120),
    where_met_text: text(300),
    phone: text(40),
    birthday_month: z.number().int().min(1).max(12).nullable(),
    birthday_day: z.number().int().min(1).max(31).nullable(),
    birthday_year: z.number().int().min(1900).max(2100).nullable(),
    notes: text(5000),
    follow_up_note: text(500),
    follow_up_date: z.iso.date().nullish().transform((v) => v ?? null),
    extras: z
      .record(z.string().max(40), z.string().max(500))
      .refine((e) => Object.keys(e).length <= 20, "Too many details.")
      .transform((e) => Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v))),
    relationship: z.enum(["business", "personal", "both"]).nullable(),
    tags: z
      .array(z.string().max(32))
      .max(20, "Use 20 tags or fewer.")
      .transform((tags) => tags.reduce<string[]>((all, tag) => addTag(all, tag), [])),
  })
  .refine((p) => (p.lat === null) === (p.lng === null), { message: "Location needs both coordinates.", path: ["lat"] })
  .refine((p) => p.birthday_day === null || (p.birthday_month !== null && p.birthday_day <= DAYS_IN_MONTH[p.birthday_month - 1]), {
    message: "That date doesn’t exist.",
    path: ["birthday_day"],
  })
  .refine((p) => new Date(p.met_at).getTime() <= Date.now() + 24 * 60 * 60 * 1000, {
    message: "When you met can’t be in the future.",
    path: ["met_at"],
  });

export type PersonInput = z.output<typeof PersonInputSchema>;

// Database ids are UUIDs; anything else can't be a saved person.
export const isPersonId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
