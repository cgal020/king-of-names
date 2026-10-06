import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service role client. Bypasses row level security, so use it only where the
// brief requires it: invite codes, username lookup at login, account deletion.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
