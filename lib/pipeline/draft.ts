// Builds the review-screen draft from whatever the pipeline produced.
import type { CleanExtraction } from "@/lib/ai/schema";
import type { Place } from "@/lib/geo/mapbox";
import type { Person } from "@/lib/types";

export type PersonDraft = Omit<Person, "id" | "created_at" | "updated_at">;

export type CaptureMeta = {
  recordedAt: string;
  timezone: string | null;
  location: { lat: number; lng: number; accuracyM: number | null } | null;
};

export function buildDraft(meta: CaptureMeta, extraction: CleanExtraction | null, place: Place | null): PersonDraft {
  const e = extraction;
  return {
    full_name: e?.full_name ?? "",
    met_at: meta.recordedAt,
    met_timezone: meta.timezone,
    lat: meta.location?.lat ?? null,
    lng: meta.location?.lng ?? null,
    location_accuracy_m: meta.location?.accuracyM ?? null,
    place_name: place?.place_name ?? null,
    city: place?.city ?? null,
    region: place?.region ?? null,
    country: place?.country ?? null,
    where_met_text: e?.where_met_text ?? null,
    phone: e?.phone ?? null,
    birthday_month: e?.birthday.month ?? null,
    birthday_day: e?.birthday.day ?? null,
    birthday_year: e?.birthday.year ?? null,
    notes: e?.notes ?? null,
    follow_up_note: e?.follow_up.note ?? null,
    follow_up_date: e?.follow_up.date ?? null,
    extras: e?.extras ?? {},
    relationship: e?.relationship ?? null,
    tags: e?.tags ?? [],
  };
}
