"use server";

// Settings actions: invite codes, export and importing contacts. In the
// preview (no accounts connected) nothing is stored.
import { revalidatePath } from "next/cache";
import { authConfigured } from "@/lib/auth/config";
import type { CardDetails } from "@/lib/cards/parse-qr";
import { fillsAnything, matchContact, missingDetails, type Fill } from "@/lib/contacts/match";
import { currentUserId } from "@/lib/data/account";
import { listMeetings, listPeople } from "@/lib/data/people";
import { listOpenTasks } from "@/lib/data/tasks";
import type { ExportPerson } from "@/lib/export/people";
import { generateInviteCode } from "@/lib/invite-code";
import { isPersonId, PersonInputSchema, type PersonInput } from "@/lib/people/validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Person } from "@/lib/types";

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

// Everyone with every meeting and their open tasks, for the CSV and JSON export.
export async function exportPeople(): Promise<ExportPerson[]> {
  const [people, tasks] = await Promise.all([listPeople(), listOpenTasks()]);
  return Promise.all(
    people.map(async (person) => ({ ...person, meetings: await listMeetings(person), tasks: tasks.filter((t) => t.person_id === person.id) })),
  );
}

// A contact becomes a person with no place, dated with the import: the file
// doesn't say when or where you met, so the app shows them as imported.
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

export type ImportResult =
  | {
      ok: true;
      added: number;
      updated: number;
      skipped: number;
      // What Undo needs: this import's time, and the details it filled in on
      // people who were already saved.
      undo: { batch: string; filled: { id: string; phone: boolean; birthday: boolean; extras: string[] }[] } | null;
    }
  | { ok: false; error: string };

// Imports contacts, matching people already saved (lib/contacts/match.ts):
// a match only gets its empty details filled in; everyone else is added,
// marked as imported, since the file doesn't say when or where you met.
export async function importContacts(contacts: CardDetails[], timeZone: string | null): Promise<ImportResult> {
  if (!Array.isArray(contacts) || contacts.length === 0) return { ok: false, error: "No contacts to import." };
  if (contacts.length > MAX_IMPORT) return { ok: false, error: `Import up to ${MAX_IMPORT} contacts at a time.` };

  const batch = new Date().toISOString();
  const named = contacts.filter((c) => typeof c?.full_name === "string" && c.full_name.trim() && Array.isArray(c.phones) && Array.isArray(c.emails));
  const skipped = contacts.length - named.length;
  if (!named.length) return { ok: false, error: "None of those contacts had a name." };

  const people = await listPeople();
  const rows: PersonInput[] = [];
  const fills: { person: Person; fill: Fill }[] = [];
  for (const contact of named) {
    const existing = matchContact(contact, people);
    if (existing) {
      const fill = missingDetails(contact, existing);
      if (fillsAnything(fill) && !fills.some((f) => f.person.id === existing.id)) fills.push({ person: existing, fill });
      continue;
    }
    const parsed = PersonInputSchema.safeParse(fromContact(contact, batch, timeZone));
    if (parsed.success && !rows.some((r) => r.full_name === parsed.data.full_name && r.phone === parsed.data.phone)) rows.push(parsed.data);
  }
  if (!authConfigured()) return { ok: true, added: rows.length, updated: fills.length, skipped, undo: null };

  const supabase = await createClient();
  if (rows.length) {
    const { error } = await supabase.from("people").insert(rows.map((r) => ({ ...r, imported_at: batch })));
    if (error) return { ok: false, error: "The import didn’t save. Check your connection and try again." };
  }
  const filled: { id: string; phone: boolean; birthday: boolean; extras: string[] }[] = [];
  for (const { person, fill } of fills) {
    const { error } = await supabase
      .from("people")
      .update({
        ...(fill.phone ? { phone: fill.phone } : {}),
        ...(fill.birthday
          ? { birthday_day: fill.birthday.day, birthday_month: fill.birthday.month, birthday_year: fill.birthday.year }
          : {}),
        extras: { ...person.extras, ...fill.extras },
      })
      .eq("id", person.id);
    if (!error) filled.push({ id: person.id, phone: Boolean(fill.phone), birthday: Boolean(fill.birthday), extras: Object.keys(fill.extras) });
  }
  revalidatePath("/people");
  return { ok: true, added: rows.length, updated: filled.length, skipped, undo: { batch, filled } };
}

// Undoes one import: removes the people it added (unless they've been met
// since) and empties the details it filled in on people already saved.
export async function undoImport(undo: NonNullable<Extract<ImportResult, { ok: true }>["undo"]>): Promise<{ ok: boolean }> {
  if (!authConfigured()) return { ok: true };
  if (!undo || typeof undo.batch !== "string" || Number.isNaN(Date.parse(undo.batch))) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("people").delete().eq("imported_at", undo.batch);
  if (error) return { ok: false };
  for (const f of Array.isArray(undo.filled) ? undo.filled.slice(0, MAX_IMPORT) : []) {
    if (!isPersonId(f.id)) continue;
    const { data: person } = await supabase.from("people").select("extras").eq("id", f.id).maybeSingle();
    if (!person) continue;
    const extras = { ...(person.extras as Record<string, string>) };
    for (const key of f.extras ?? []) delete extras[key];
    await supabase
      .from("people")
      .update({
        ...(f.phone ? { phone: null } : {}),
        ...(f.birthday ? { birthday_day: null, birthday_month: null, birthday_year: null } : {}),
        extras,
      })
      .eq("id", f.id);
  }
  revalidatePath("/people");
  return { ok: true };
}
