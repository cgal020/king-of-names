// Mirrors the `people` table in supabase/migrations.
export type Person = {
  id: string;
  full_name: string;
  met_at: string;
  met_timezone: string | null;
  lat: number | null;
  lng: number | null;
  location_accuracy_m: number | null;
  place_name: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  where_met_text: string | null;
  phone: string | null;
  birthday_month: number | null;
  birthday_day: number | null;
  birthday_year: number | null;
  notes: string | null;
  follow_up_note: string | null;
  follow_up_date: string | null;
  extras: PersonExtras;
  relationship: "business" | "personal" | "both" | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type PersonExtras = {
  email?: string;
  company?: string;
  role?: string;
  [key: string]: string | undefined;
};

export type Confidence = "high" | "medium" | "low";

// What the capture pipeline hands to the review screen.
export type Draft = {
  captureId: string;
  person: Omit<Person, "id" | "created_at" | "updated_at">;
  transcript: string | null;
  durationSeconds: number | null;
  nameConfidence: Confidence;
  additionalPeople: string[];
};

export type PhotoKind = "person" | "card" | "moment";

// Mirrors the `photos` table, plus a display URL (a short-lived signed URL in
// the real app).
export type Photo = {
  id: string;
  person_id: string | null;
  capture_id: string | null;
  kind: PhotoKind;
  url: string;
  width: number | null;
  height: number | null;
  taken_at: string | null;
  taken_timezone: string | null;
  lat: number | null;
  lng: number | null;
  location_accuracy_m: number | null;
  location_source: "device" | "photo" | "none";
  // Reverse-geocoded label for display, e.g. "Dubai Marina, Dubai".
  place_label: string | null;
};
