import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/auth-forms";
import { safeNext } from "@/lib/auth/validate";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = { title: `Sign in · ${appConfig.name}` };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, deleted } = await searchParams;
  return (
    <>
      <h1 className="type-display">Remember everyone you meet.</h1>
      <p className="mt-3 mb-8 text-[1.0625rem] leading-relaxed text-muted-foreground">
        Say a name and a detail after you meet someone. {appConfig.name} keeps where and when, and finds them for
        you later.
      </p>
      <SignInForm
        next={typeof next === "string" ? safeNext(next) : null}
        notice={deleted ? "Your account and everything in it have been deleted." : null}
      />
    </>
  );
}
