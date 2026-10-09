// Sample quick takes for the Event mode mockup: what the pipeline might make
// of a few seconds about each person met at a gallery night.
import type { Confidence, Draft } from "@/lib/types";

type SampleTake = {
  full_name: string;
  notes: string;
  role?: string;
  company?: string;
  relationship: "business" | "personal" | "both";
  tags: string[];
  nameConfidence: Confidence;
  transcript: string;
};

const SAMPLES: SampleTake[] = [
  {
    full_name: "Layla Nasser",
    notes: "Curator. Wants an intro to Omar about the family office collection.",
    role: "Curator",
    relationship: "business",
    tags: ["Connector"],
    nameConfidence: "high",
    transcript: "Layla Nasser, curator, wants an intro to Omar about the family office collection.",
  },
  {
    full_name: "Karim Aziz",
    notes: "Runs a specialty coffee roastery in Al Quoz. Supplies two of the galleries.",
    company: "Aziz Roasters",
    relationship: "business",
    tags: ["Supplier", "Hospitality"],
    nameConfidence: "high",
    transcript: "Karim Aziz, runs a coffee roastery in Al Quoz, supplies two of the galleries here.",
  },
  {
    full_name: "Dana Petrova",
    notes: "Architect from Riga, in Dubai until the 20th. Loves brutalism.",
    role: "Architect",
    relationship: "both",
    tags: ["Design"],
    nameConfidence: "medium",
    transcript: "Dana, Petrova I think, architect from Riga, here until the twentieth, loves brutalism.",
  },
  {
    full_name: "Faisal Al-Amiri",
    notes: "Collects photography. Asked about the Bangkok show.",
    relationship: "personal",
    tags: ["Art"],
    nameConfidence: "high",
    transcript: "Faisal Al-Amiri, collects photography, asked about the Bangkok show.",
  },
  {
    full_name: "Hana Sato",
    notes: "Runs a gallery in Tokyo, in town until Sunday. Wants to see the studio.",
    company: "Sato Gallery",
    relationship: "business",
    tags: ["Art", "Partner"],
    nameConfidence: "medium",
    transcript: "Hana Sato, Tokyo gallery, here until Sunday, wants to come see the studio.",
  },
];

export function mockTakeDraft(
  index: number,
  meta: {
    captureId: string;
    recordedAt: string;
    timezone: string | null;
    durationSeconds: number;
    location: { lat: number; lng: number; accuracyM: number | null } | null;
    eventName: string;
  },
): Draft {
  const s = SAMPLES[index % SAMPLES.length];
  return {
    captureId: meta.captureId,
    transcript: s.transcript,
    durationSeconds: Math.round(meta.durationSeconds),
    nameConfidence: s.nameConfidence,
    additionalPeople: [],
    person: {
      full_name: s.full_name,
      met_at: meta.recordedAt,
      met_timezone: meta.timezone,
      lat: meta.location?.lat ?? null,
      lng: meta.location?.lng ?? null,
      location_accuracy_m: meta.location?.accuracyM ?? null,
      place_name: meta.location ? "Alserkal Avenue" : null,
      city: meta.location ? "Dubai" : null,
      region: meta.location ? "Dubai" : null,
      country: meta.location ? "United Arab Emirates" : null,
      where_met_text: meta.eventName,
      phone: null,
      birthday_month: null,
      birthday_day: null,
      birthday_year: null,
      notes: s.notes,
      follow_up_note: null,
      follow_up_date: null,
      extras: { ...(s.role && { role: s.role }), ...(s.company && { company: s.company }) },
      relationship: s.relationship,
      tags: s.tags,
    },
  };
}
