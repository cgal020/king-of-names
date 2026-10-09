import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/auth-forms";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = { title: `Create your account · ${appConfig.name}` };

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const { code } = await searchParams;
  return (
    <>
      <h1 className="type-heading">Create your account</h1>
      <p className="mt-3 mb-8 text-[1.0625rem] leading-relaxed text-muted-foreground">
        Your people stay private to your account. Whoever invited you can&rsquo;t see them.
      </p>
      <SignUpForm invite={typeof code === "string" ? code : null} />
    </>
  );
}
