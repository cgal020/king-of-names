"use server";

// Saving, changing and deleting people. Every action checks its input on the
// server; row level security makes sure a user only ever touches their own
// rows. In the preview (no accounts connected) nothing is stored.
import { revalidatePath } from "next/cache";
import { usingSampleData } from "@/lib/data/people";
import { reverseGeocode } from "@/lib/geo/reverse-geocode";
import { isPersonId, PersonInputSchema, type PersonInput } from "@/lib/people/validate";
import { createClient } from "@/lib/supabase/server";

export type SaveResult =
  | { ok: true; id: string | null; preview?: boolean }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const NOT_SAVED = "That didn’t save. Check your connection and try again.";

function invalid(error: { issues: { path: PropertyKey[]; message: string }[] }): SaveResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: Object.values(fieldErrors)[0] ?? "Check the highlighted fields.", fieldErrors };
}

// The place shown while editing comes from Mapbox's temporary lookup, which
// may not be stored, so a new or moved pin is looked up again permanently.
// A city picked from the list is kept as chosen, with no place name.
async function withPlace(person: PersonInput, { lookUp }: { lookUp: boolean }): Promise<PersonInput> {
  if (!lookUp || person.lat === null || person.lng === null) return person;
  try {
    const place = await reverseGeocode(person.lat, person.lng);
    if (!place) return person;
    return {
      ...person,
      place_name: place.place_name,
      city: place.city ?? person.city,
      region: place.region,
      country: place.country ?? person.country,
    };
  } catch {
    // Mapbox unreachable: keep what the form had rather than fail the save.
    return person;
  }
}

export async function createPerson(input: unknown, { cityByHand = false } = {}): Promise<SaveResult> {
  const parsed = PersonInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (usingSampleData()) return { ok: true, id: null, preview: true };

  const person = await withPlace(parsed.data, { lookUp: !cityByHand });
  const supabase = await createClient();
  const { data, error } = await supabase.from("people").insert(person).select("id").single();
  if (error || !data) return { ok: false, error: NOT_SAVED };
  revalidatePath("/people");
  return { ok: true, id: data.id as string };
}

export async function updatePerson(id: string, input: unknown, { cityByHand = false } = {}): Promise<SaveResult> {
  const parsed = PersonInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (usingSampleData()) return { ok: true, id, preview: true };
  if (!isPersonId(id)) return { ok: false, error: "This person no longer exists." };

  const supabase = await createClient();
  const { data: before } = await supabase.from("people").select("lat, lng").eq("id", id).maybeSingle();
  if (!before) return { ok: false, error: "This person no longer exists." };
  const moved = before.lat !== parsed.data.lat || before.lng !== parsed.data.lng;
  const person = await withPlace(parsed.data, { lookUp: moved && !cityByHand });

  const { error } = await supabase.from("people").update(person).eq("id", id);
  if (error) return { ok: false, error: NOT_SAVED };
  revalidatePath("/people");
  revalidatePath(`/people/${id}`);
  return { ok: true, id };
}

// Deletes the person and everything recorded about them: their voice notes
// (rows and audio files) and photos.
export async function deletePerson(id: string): Promise<{ ok: boolean; error?: string }> {
  if (usingSampleData()) return { ok: true };
  if (!isPersonId(id)) return { ok: false, error: "This person no longer exists." };

  const supabase = await createClient();
  const [{ data: captures }, { data: photos }] = await Promise.all([
    supabase.from("captures").select("id, audio_path").eq("person_id", id),
    supabase.from("photos").select("id, storage_path").eq("person_id", id),
  ]);
  const audio = (captures ?? []).map((c) => c.audio_path as string | null).filter((p): p is string => Boolean(p));
  const images = (photos ?? []).map((p) => p.storage_path as string | null).filter((p): p is string => Boolean(p));
  if (audio.length) await supabase.storage.from("audio").remove(audio);
  if (images.length) await supabase.storage.from("photos").remove(images);
  if (captures?.length) await supabase.from("captures").delete().eq("person_id", id);
  if (photos?.length) await supabase.from("photos").delete().eq("person_id", id);

  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) return { ok: false, error: "That didn’t delete. Check your connection and try again." };
  revalidatePath("/people");
  return { ok: true };
}
