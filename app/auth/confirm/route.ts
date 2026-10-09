// The link in the password reset email lands here. Verifying the one-time
// token signs the person in for long enough to choose a new password.
// Supabase's "Reset password" email template must link to:
// {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { authConfigured } from "@/lib/auth/config";
import { safeNext } from "@/lib/auth/validate";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const next = safeNext(params.get("next"));

  if (authConfigured() && tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
  }
  redirect("/forgot-password?expired=1");
}
