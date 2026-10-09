"use server";

// Event Mode's events, kept in the database so takes can say which event
// they came from (and where you met). Best effort: if this doesn't get
// through, the takes are still saved, just without their event.
import { authConfigured } from "@/lib/auth/config";
import { isPersonId } from "@/lib/people/validate";
import { createClient } from "@/lib/supabase/server";

export async function startEvent(id: string, name: string): Promise<{ ok: boolean }> {
  const title = name.trim().slice(0, 80);
  if (!authConfigured()) return { ok: true };
  if (!isPersonId(id) || !title) return { ok: false };
  const supabase = await createClient();
  // One event runs at a time: one left open elsewhere ends now.
  await supabase.from("events").update({ ended_at: new Date().toISOString() }).is("ended_at", null);
  const { error } = await supabase.from("events").insert({ id, name: title });
  return { ok: !error || error.code === "23505" };
}

export async function endEvent(id: string): Promise<{ ok: boolean }> {
  if (!authConfigured()) return { ok: true };
  if (!isPersonId(id)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ ended_at: new Date().toISOString() }).eq("id", id).is("ended_at", null);
  return { ok: !error };
}
