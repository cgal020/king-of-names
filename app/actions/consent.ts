"use server";

// The user's answer to the AI consent sheet, kept on their account (as
// ai_consent_at in its metadata) so another phone doesn't ask again.
import { authConfigured } from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/server";

export async function setAiConsent(agree: boolean): Promise<{ ok: boolean }> {
  if (!authConfigured()) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { ai_consent_at: agree ? new Date().toISOString() : null } });
  if (error) return { ok: false };
  // The session token carries the answer, so the next page load reads it.
  await supabase.auth.refreshSession();
  return { ok: true };
}
