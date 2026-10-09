import "server-only";
// The signed-in account for Settings: who you are and the invite codes you
// have made. Invite codes have no client access at all, so they are read with
// the service role, always filtered to the signed-in user.
import { authConfigured } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type Account = { username: string; displayName: string | null; email: string | null };
export type Invite = { code: string; usedBy: string | null; usedAt: string | null };

const SAMPLE_ACCOUNT: Account = { username: "cameron", displayName: "Cameron Gallagher", email: "cameron@example.com" };
const SAMPLE_INVITES: Invite[] = [
  { code: "M4QK-7XRT-9PWD", usedBy: "sarah_k", usedAt: "2026-09-12T10:00:00Z" },
  { code: "H2NB-5CJV-3TQE", usedBy: null, usedAt: null },
];

export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

export async function getAccount(): Promise<Account> {
  if (!authConfigured()) return SAMPLE_ACCOUNT;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const id = claims?.claims?.sub as string | undefined;
  const { data: profile } = id
    ? await supabase.from("profiles").select("username, display_name").eq("id", id).maybeSingle()
    : { data: null };
  return {
    username: (profile?.username as string | undefined) ?? "",
    displayName: (profile?.display_name as string | null | undefined) ?? null,
    email: (claims?.claims?.email as string | undefined) ?? null,
  };
}

// Whether this account agreed to send notes, cards and questions to the AI
// providers (see app/actions/consent.ts). Null in the preview, where each
// phone keeps its own answer.
export async function getAiConsent(): Promise<boolean | null> {
  if (!authConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const metadata = data?.claims?.user_metadata as { ai_consent_at?: string | null } | undefined;
  return Boolean(metadata?.ai_consent_at);
}

export async function listInvites(): Promise<Invite[]> {
  if (!authConfigured()) return SAMPLE_INVITES;
  const userId = await currentUserId();
  if (!userId) return [];
  const admin = createAdminClient();
  const { data: codes } = await admin
    .from("invite_codes")
    .select("code, used_by, used_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });
  const usedIds = (codes ?? []).map((c) => c.used_by as string | null).filter((id): id is string => Boolean(id));
  const { data: users } = usedIds.length
    ? await admin.from("profiles").select("id, username").in("id", usedIds)
    : { data: [] as { id: string; username: string }[] };
  const username = new Map((users ?? []).map((u) => [u.id as string, u.username as string]));
  return (codes ?? []).map((c) => ({
    code: c.code as string,
    usedBy: c.used_by ? (username.get(c.used_by as string) ?? "someone") : null,
    usedAt: (c.used_at as string | null) ?? null,
  }));
}
