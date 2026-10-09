import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = { title: `Choose a new password · ${appConfig.name}` };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-2 mb-8 text-[0.95rem] text-muted-foreground">You&rsquo;ll stay signed in on this phone.</p>
      <ResetPasswordForm />
    </>
  );
}
