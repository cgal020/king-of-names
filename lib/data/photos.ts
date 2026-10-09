import "server-only";
// Photos on the server: a private bucket with one folder per account and a
// row in `photos` for each. The phone re-encodes every photo to JPEG first,
// which also strips EXIF. Links to view them are signed and expire.
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Photo } from "@/lib/types";

export const PHOTO_COLUMNS =
  "id, person_id, capture_id, kind, storage_path, width, height, taken_at, taken_timezone, lat, lng, " +
  "location_accuracy_m, location_source, place_label, created_at";

type PhotoRow = Omit<Photo, "url"> & { storage_path: string; created_at: string };

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const LINK_SECONDS = 60 * 60;

const isTimeZone = (zone: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};
const optionalNumber = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.coerce.number().min(min).max(max).nullable());

// What the phone sends with a photo. It always belongs to a saved person.
export const PhotoUploadSchema = z
  .object({
    id: z.uuid(),
    person_id: z.uuid(),
    kind: z.enum(["person", "card", "moment"]),
    width: z.coerce.number().int().min(1).max(8192),
    height: z.coerce.number().int().min(1).max(8192),
    taken_at: z.preprocess((v) => (v === "" ? null : v), z.iso.datetime({ offset: true }).nullable()),
    taken_timezone: z.preprocess((v) => (v === "" ? null : v), z.string().max(64).refine(isTimeZone).nullable()),
    lat: optionalNumber(-90, 90),
    lng: optionalNumber(-180, 180),
    location_accuracy_m: optionalNumber(0, 100_000),
    location_source: z.enum(["device", "photo", "none"]),
  })
  .refine((p) => (p.lat === null) === (p.lng === null), { message: "lat and lng go together" });

// Rows with a fresh link each, in one request to storage.
export async function withUrls(supabase: SupabaseClient, rows: PhotoRow[]): Promise<Photo[]> {
  if (!rows.length) return [];
  const { data } = await supabase.storage.from("photos").createSignedUrls(
    rows.map((r) => r.storage_path),
    LINK_SECONDS,
  );
  const url = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return rows.flatMap(({ storage_path, created_at, ...photo }) => {
    void created_at;
    const link = url.get(storage_path);
    return link ? [{ ...photo, url: link }] : [];
  });
}

export async function listPhotos(supabase: SupabaseClient): Promise<Photo[]> {
  const { data } = await supabase.from("photos").select(PHOTO_COLUMNS).order("taken_at", { ascending: true, nullsFirst: true });
  return withUrls(supabase, (data ?? []) as unknown as PhotoRow[]);
}

export async function getPhotoRow(supabase: SupabaseClient, id: string): Promise<PhotoRow | null> {
  const { data } = await supabase.from("photos").select(PHOTO_COLUMNS).eq("id", id).maybeSingle();
  return (data as unknown as PhotoRow | null) ?? null;
}
