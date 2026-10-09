// Photos: GET lists the account's photos with short-lived links; POST stores
// one (already a JPEG under 5 MB, re-encoded on the phone) for a saved person,
// with its place looked up once. Signed-in users only.
import { authConfigured } from "@/lib/auth/config";
import { getPhotoRow, listPhotos, MAX_PHOTO_BYTES, PhotoUploadSchema, withUrls } from "@/lib/data/photos";
import { reverseGeocode } from "@/lib/geo/reverse-geocode";
import { createClient } from "@/lib/supabase/server";

const noStore = { "Cache-Control": "private, no-store" };

async function signedIn() {
  if (!authConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  return userId ? { supabase, userId } : null;
}

export async function GET() {
  const session = await signedIn();
  if (!session) return Response.json({ photos: [] }, { headers: noStore });
  return Response.json({ photos: await listPhotos(session.supabase) }, { headers: noStore });
}

export async function POST(request: Request) {
  const session = await signedIn();
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { supabase, userId } = session;

  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!form || !(file instanceof File) || file.size === 0) return Response.json({ error: "The photo is missing." }, { status: 400 });
  if (file.size > MAX_PHOTO_BYTES) return Response.json({ error: "The photo is larger than 5 MB." }, { status: 413 });
  if (file.type !== "image/jpeg") return Response.json({ error: "Photos are sent as JPEG." }, { status: 415 });
  const fields = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = PhotoUploadSchema.safeParse(fields);
  if (!parsed.success) return Response.json({ error: "The photo's details are incomplete." }, { status: 400 });
  const photo = parsed.data;

  // The same photo sent again: same answer.
  const existing = await getPhotoRow(supabase, photo.id);
  if (existing) return Response.json({ photo: (await withUrls(supabase, [existing]))[0] ?? null }, { headers: noStore });

  const path = `${userId}/${photo.id}.jpg`;
  const stored = await supabase.storage.from("photos").upload(path, file, { contentType: "image/jpeg", upsert: true });
  if (stored.error) return Response.json({ error: "The photo couldn't be stored." }, { status: 503 });

  const place =
    photo.lat !== null && photo.lng !== null ? await reverseGeocode(photo.lat, photo.lng).catch(() => null) : null;
  const placeLabel = place ? [place.place_name, place.city].filter(Boolean).join(", ") || null : null;

  const { data, error } = await supabase
    .from("photos")
    .insert({
      id: photo.id,
      person_id: photo.person_id,
      kind: photo.kind,
      storage_path: path,
      mime: "image/jpeg",
      width: photo.width,
      height: photo.height,
      bytes: file.size,
      taken_at: photo.taken_at,
      taken_timezone: photo.taken_timezone,
      lat: photo.lat,
      lng: photo.lng,
      location_accuracy_m: photo.location_accuracy_m,
      location_source: photo.location_source,
      place_label: placeLabel,
    })
    .select("id")
    .single();
  if (error || !data) {
    // The same photo arriving twice at once: the other copy saved it, and the
    // file is theirs too, so it stays.
    if (error?.code === "23505") {
      const row = await getPhotoRow(supabase, photo.id);
      return Response.json({ photo: row ? ((await withUrls(supabase, [row]))[0] ?? null) : null }, { headers: noStore });
    }
    await supabase.storage.from("photos").remove([path]);
    return Response.json({ error: "The photo couldn't be saved." }, { status: error?.code === "23503" ? 400 : 503 });
  }
  const row = await getPhotoRow(supabase, photo.id);
  return Response.json({ photo: row ? ((await withUrls(supabase, [row]))[0] ?? null) : null }, { status: 201, headers: noStore });
}
