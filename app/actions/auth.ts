"use server";

// Sign in, sign up, password reset, sign out and account deletion. Every
// action validates on the server; the forms' own checks are only a courtesy.
// Errors never say whether an account exists.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authConfigured } from "@/lib/auth/config";
import {
  fieldErrors,
  isEmail,
  NewPasswordSchema,
  normalizeUsername,
  ResetRequestSchema,
  safeNext,
  SignInSchema,
  SignUpSchema,
  type FormState,
} from "@/lib/auth/validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const SIGN_IN_FAILED = "That username or password didn’t match.";
const TOO_MANY = "Too many tries. Wait a few minutes, then try again.";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

// The email behind a username, or the email itself.
async function emailFor(identifier: string) {
  if (isEmail(identifier)) return identifier.trim().toLowerCase();
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("username", normalizeUsername(identifier))
    .maybeSingle();
  if (!profile) return null;
  const { data } = await admin.auth.admin.getUserById(profile.id);
  return data.user?.email ?? null;
}

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const values = { identifier: text(formData, "identifier") };
  const parsed = SignInSchema.safeParse({ identifier: values.identifier, password: text(formData, "password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const next = safeNext(formData.get("next"));
  if (!authConfigured()) redirect(next);

  const email = await emailFor(parsed.data.identifier);
  if (!email) return { error: SIGN_IN_FAILED, values };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) return { error: error.status === 429 ? TOO_MANY : SIGN_IN_FAILED, values };
  redirect(next);
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const values = {
    invite: text(formData, "invite"),
    name: text(formData, "name"),
    username: text(formData, "username"),
    email: text(formData, "email"),
  };
  const parsed = SignUpSchema.safeParse({ ...values, password: text(formData, "password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  if (!authConfigured()) redirect("/capture");

  const { invite, name, username, email, password } = parsed.data;
  const admin = createAdminClient();

  const { data: taken } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (taken) return { fieldErrors: { username: "That username is taken. Try another." }, values };

  // Claim the code in one step, so two people can't use it at the same time.
  const claimedAt = new Date().toISOString();
  const { data: claimed } = await admin
    .from("invite_codes")
    .update({ used_at: claimedAt })
    .eq("code", invite)
    .is("used_at", null)
    .select("code")
    .maybeSingle();
  if (!claimed) return { fieldErrors: { invite: "That invite code isn’t valid or has already been used." }, values };

  // Created confirmed: the invite code already vouches for the person.
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: name },
  });
  if (error || !created.user) {
    await admin.from("invite_codes").update({ used_at: null }).eq("code", invite).eq("used_at", claimedAt);
    if (error?.code === "email_exists") {
      return { fieldErrors: { email: "There’s already an account with this email. Sign in instead." }, values };
    }
    return { error: "Couldn’t create your account. Try again in a moment.", values };
  }
  await admin.from("invite_codes").update({ used_by: created.user.id }).eq("code", invite);

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  redirect(signInError ? "/login" : "/capture");
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const values = { identifier: text(formData, "identifier") };
  const parsed = ResetRequestSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  // The same answer whether or not there's an account.
  const sent: FormState = {
    message: "If there’s an account for that, we’ve emailed a link to reset the password. It works for one hour.",
    values,
  };
  if (!authConfigured()) return sent;

  const email = await emailFor(parsed.data.identifier).catch(() => null);
  if (email) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await siteUrl()}/auth/confirm?next=/reset-password`,
    });
  }
  return sent;
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = NewPasswordSchema.safeParse({ password: text(formData, "password"), confirm: text(formData, "confirm") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (!authConfigured()) redirect("/capture");

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "This reset link has expired. Ask for a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "That’s your current password. Choose a new one."
          : "Couldn’t save the new password. Try again.",
    };
  }
  redirect("/capture");
}

export async function signOut() {
  if (authConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

// Removes the account and everything in it: the recordings and photos in
// storage first (the database can't reach them), then the user, which takes
// the profile, people, captures, photos and events with it. Returns rather
// than redirecting, so the phone clears its own copy only once this worked.
export async function deleteAccount(): Promise<{ result: "deleted" | "preview" } | { error: string }> {
  if (!authConfigured()) return { result: "preview" };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const admin = createAdminClient();
  for (const bucket of ["audio", "photos"]) {
    for (;;) {
      const { data: files, error } = await admin.storage.from(bucket).list(userId, { limit: 1000 });
      if (error) return { error: "Couldn’t delete everything. Your account is still here; try again." };
      if (!files?.length) break;
      const { error: removeError } = await admin.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
      if (removeError) return { error: "Couldn’t delete everything. Your account is still here; try again." };
    }
  }
  // Their unused invite codes go too, so nobody joins on a deleted account's invite.
  const { error: inviteError } = await admin.from("invite_codes").delete().eq("created_by", userId).is("used_by", null);
  if (inviteError) return { error: "Couldn’t delete everything. Your account is still here; try again." };
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: "Couldn’t delete your account. Try again." };
  await supabase.auth.signOut();
  return { result: "deleted" };
}
