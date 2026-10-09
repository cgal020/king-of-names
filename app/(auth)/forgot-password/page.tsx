import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = { title: `Reset your password · ${appConfig.name}` };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const { expired } = await searchParams;
  return (
    <>
      <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-2 mb-8 text-[0.95rem] text-muted-foreground">
        We&rsquo;ll email you a link to choose a new one.
      </p>
      <ForgotPasswordForm expired={Boolean(expired)} />
    </>
  );
}
