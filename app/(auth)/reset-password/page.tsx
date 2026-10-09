import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = { title: `Choose a new password · ${appConfig.name}` };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="type-heading">Choose a new password</h1>
      <p className="mt-3 mb-8 text-[1.0625rem] leading-relaxed text-muted-foreground">You&rsquo;ll stay signed in on this phone.</p>
      <ResetPasswordForm />
    </>
  );
}
