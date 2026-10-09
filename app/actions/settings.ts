"use server";

// Settings actions: invite codes, export and importing contacts. In the
// preview (no accounts connected) nothing is stored.
import { revalidatePath } from "next/cache";
import { authConfigured } from "@/lib/auth/config";
import type { CardDetails } from "@/lib/cards/parse-qr";
import { currentUserId } from "@/lib/data/account";
import { listMeetings, listPeople } from "@/lib/data/people";
import type { ExportPerson } from "@/lib/export/people";
import { generateInviteCode } from "@/lib/invite-code";
import { PersonInputSchema } from "@/lib/people/validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Enough to invite a few people at once, not enough to hand out codes in bulk.
const MAX_UNUSED_INVITES = 5;
const MAX_IMPORT = 500;

export async function createInvite(): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  if (!authConfigured()) return { ok: true, code: generateInviteCode() };
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in again, then try." };

  const admin = createAdminClient();
  const { count } = await admin
    .from("invite_codes")
    .select("code", { count: "exact", head: true })
    .eq("created_by", userId)
    .is("used_by", null);
  if ((count ?? 0) >= MAX_UNUSED_INVITES) {
    return { ok: false, error: `You have ${MAX_UNUSED_INVITES} codes nobody has used yet. Share those first.` };
  }
  const code = generateInviteCode();
  const { error } = await admin.from("invite_codes").insert({ code, created_by: userId });
  if (error) return { ok: false, error: "Couldn’t make a code. Try again." };
  revalidatePath("/settings");
  return { ok: true, code };
}

// Everyone with every meeting, for the CSV and JSON export.
export async function exportPeople(): Promise<ExportPerson[]> {
  const people = await listPeople();
  return Promise.all(people.map(async (person) => ({ ...person, meetings: await listMeetings(person) })));
}

// A contact becomes a person met "now", with no place, since the file
// doesn't say where you met.
function fromContact(c: CardDetails, metAt: string, timeZone: string | null) {
  const extras: Record<string, string> = {};
  if (c.emails[0]) extras.email = c.emails[0];
  if (c.company) extras.company = c.company;
  if (c.role) extras.role = c.role;
  if (c.websites[0]) extras.website = c.websites[0];
  if (c.linkedin) extras.linkedin = c.linkedin;
  if (c.line) extras.line = c.line;
  if (c.address) extras.address = c.address;
  return {
    full_name: c.full_name ?? "",
    met_at: metAt,
    met_timezone: timeZone,
    lat: null,
    lng: null,
    location_accuracy_m: null,
    place_name: null,
    city: null,
    region: null,
    country: null,
    where_met_text: null,
    phone: c.phones[0] ?? null,
    birthday_month: c.birthday?.month ?? null,
    birthday_day: c.birthday?.day ?? null,
    birthday_year: c.birthday?.year ?? null,
    notes: c.notes,
    follow_up_note: null,
    follow_up_date: null,
    extras,
    relationship: null,
    tags: [],
  };
}

export async function importContacts(
  contacts: CardDetails[],
  timeZone: string | null,
): Promise<{ ok: true; count: number; skipped: number } | { ok: false; error: string }> {
  if (!Array.isArray(contacts) || contacts.length === 0) return { ok: false, error: "No contacts to import." };
  if (contacts.length > MAX_IMPORT) return { ok: false, error: `Import up to ${MAX_IMPORT} contacts at a time.` };

  const now = new Date().toISOString();
  const rows = contacts.flatMap((c) => {
    try {
      const parsed = PersonInputSchema.safeParse(fromContact(c, now, timeZone));
      return parsed.success ? [parsed.data] : [];
    } catch {
      // Not the shape the import sends: skip it.
      return [];
    }
  });
  const skipped = contacts.length - rows.length;
  if (!authConfigured()) return { ok: true, count: rows.length, skipped };
  if (!rows.length) return { ok: false, error: "None of those contacts had a name." };

  const supabase = await createClient();
  const { error } = await supabase.from("people").insert(rows);
  if (error) return { ok: false, error: "The import didn’t save. Check your connection and try again." };
  revalidatePath("/people");
  return { ok: true, count: rows.length, skipped };
}
