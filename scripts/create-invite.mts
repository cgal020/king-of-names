// Creates one unused invite code and prints it. Used for the very first
// account; after that, signed-in users generate codes in Settings.
// Run with: npm run invite:create
import { createClient } from "@supabase/supabase-js";
import { generateInviteCode } from "../lib/invite-code.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const code = generateInviteCode();
const { error } = await admin.from("invite_codes").insert({ code });

if (error) {
  console.error("Could not create invite code:", error.message);
  process.exit(1);
}

console.log(code);
