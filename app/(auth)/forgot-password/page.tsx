import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = { title: `Reset your password · ${appConfig.name}` };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const { expired } = await searchParams;
  return (
    <>
      <h1 className="type-heading">Reset your password</h1>
      <p className="mt-3 mb-8 text-[1.0625rem] leading-relaxed text-muted-foreground">
        We&rsquo;ll email you a link to choose a new one.
      </p>
      <ForgotPasswordForm expired={Boolean(expired)} />
    </>
  );
}
