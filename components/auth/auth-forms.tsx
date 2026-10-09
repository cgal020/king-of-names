"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PASSWORD_MIN, type FormState } from "@/lib/auth/validate";
import { cn } from "@/lib/utils";

type FieldProps = Omit<React.ComponentProps<"input">, "id"> & {
  name: string;
  label: string;
  hint?: string;
  error?: string;
};

function Field({ name, label, hint, error, className, type, ...input }: FieldProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const password = type === "password";
  const described = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={password && shown ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
          className={cn(password && "pr-12", className)}
          {...input}
        />
        {password && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground"
          >
            {shown ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function FormError({ state }: { state: FormState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {state.error}
    </p>
  );
}

const footerLink = "font-medium text-primary underline-offset-4 hover:underline";

export function SignInForm({ next, notice }: { next: string | null; notice: string | null }) {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {notice && !state.error && (
        <p role="status" className="rounded-xl bg-muted px-4 py-3 text-sm">
          {notice}
        </p>
      )}
      <FormError state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field
        key={`identifier-${state.values?.identifier}`}
        name="identifier"
        label="Username or email"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        defaultValue={state.values?.identifier}
        error={state.fieldErrors?.identifier}
        required
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
        required
      />
      <Button type="submit" size="touch-lg" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <Link href="/forgot-password" className={cn(footerLink, "self-start text-sm")}>
        Forgot your password?
      </Link>
      <p className="border-t pt-5 text-sm text-muted-foreground">
        New here? You need an invite code from someone who already uses it.{" "}
        <Link href="/signup" className={footerLink}>
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm({ invite }: { invite: string | null }) {
  const [state, action, pending] = useActionState(signUp, {});
  const v = state.values;
  const e = state.fieldErrors;
  // Re-mount the fields after a failed attempt so they show what was sent.
  const key = JSON.stringify(v ?? {});
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormError state={state} />
      <div key={key} className="flex flex-col gap-5">
        <Field
          name="invite"
          label="Invite code"
          hint="From the person who invited you, like K7QM-4XRT-9PWD."
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          defaultValue={v?.invite ?? invite ?? ""}
          error={e?.invite}
          required
        />
        <Field name="name" label="Your name" autoComplete="name" defaultValue={v?.name} error={e?.name} required />
        <Field
          name="username"
          label="Username"
          hint="3 to 24 lowercase letters, numbers or _. You can sign in with it."
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          defaultValue={v?.username}
          error={e?.username}
          required
        />
        <Field
          name="email"
          label="Email"
          type="email"
          hint="Only for password resets. Nobody else sees it."
          autoComplete="email"
          inputMode="email"
          defaultValue={v?.email}
          error={e?.email}
          required
        />
      </div>
      <Field
        name="password"
        label="Password"
        type="password"
        hint={`At least ${PASSWORD_MIN} characters.`}
        autoComplete="new-password"
        error={e?.password}
        required
      />
      <Button type="submit" size="touch-lg" disabled={pending}>
        {pending ? "Creating your account…" : "Create account"}
      </Button>
      <p className="border-t pt-5 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className={footerLink}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm({ expired }: { expired: boolean }) {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  if (state.message) {
    return (
      <div className="flex flex-col gap-5">
        <p role="status" className="rounded-xl bg-muted px-4 py-3 text-[0.95rem]">
          {state.message}
        </p>
        <Link href="/login" className={cn(footerLink, "text-sm")}>
          Back to sign in
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {expired && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          That reset link has expired or was already used. Ask for a new one.
        </p>
      )}
      <Field
        key={state.values?.identifier}
        name="identifier"
        label="Username or email"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        defaultValue={state.values?.identifier}
        error={state.fieldErrors?.identifier}
        required
      />
      <Button type="submit" size="touch-lg" disabled={pending}>
        {pending ? "Sending…" : "Email me a reset link"}
      </Button>
      <Link href="/login" className={cn(footerLink, "self-start text-sm")}>
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormError state={state} />
      <Field
        name="password"
        label="New password"
        type="password"
        hint={`At least ${PASSWORD_MIN} characters.`}
        autoComplete="new-password"
        error={state.fieldErrors?.password}
        required
      />
      <Field
        name="confirm"
        label="Type it again"
        type="password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirm}
        required
      />
      <Button type="submit" size="touch-lg" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
      {state.error && (
        <Link href="/forgot-password" className={cn(footerLink, "self-start text-sm")}>
          Ask for a new link
        </Link>
      )}
    </form>
  );
}
