// Sign-in, sign-up and password rules, shared by the forms and the server
// actions. Usernames match the profiles.username check in the database.
import { z } from "zod";
import { normalizeInviteCode } from "@/lib/invite-code";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
// Supabase hashes passwords with bcrypt, which reads at most 72 bytes.
export const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72;

// "@Cameron " -> "cameron": people type usernames the way they see them.
export function normalizeUsername(input: string) {
  return input.trim().replace(/^@/, "").toLowerCase();
}

export const isEmail = (identifier: string) => identifier.includes("@") && !identifier.startsWith("@");

const password = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .refine((p) => new TextEncoder().encode(p).length <= PASSWORD_MAX_BYTES, "Use a shorter password (72 bytes at most).");

// Trimmed before it is checked: autofill on phones often adds a space.
const email = z
  .string()
  .transform((e) => e.trim().toLowerCase())
  .pipe(z.email("Enter a valid email address."));

export const SignInSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email."),
  password: z.string().min(1, "Enter your password."),
});

export const SignUpSchema = z.object({
  invite: z
    .string()
    .transform(normalizeInviteCode)
    .pipe(z.string().min(8, "Enter the invite code you were given.")),
  name: z.string().trim().min(1, "Enter your name.").max(60, "Use 60 characters or fewer."),
  username: z
    .string()
    .transform(normalizeUsername)
    .pipe(z.string().regex(USERNAME_PATTERN, "Use 3 to 24 lowercase letters, numbers or _.")),
  email,
  password,
});

export const ResetRequestSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email."),
});

export const NewPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "The passwords don’t match.", path: ["confirm"] });

// What a form gets back from its action. Values are echoed (never passwords)
// so a form that failed doesn't make people type everything again.
export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  message?: string;
  values?: Partial<Record<string, string>>;
};

export function fieldErrors(error: z.ZodError): FormState["fieldErrors"] {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

// Only paths inside the app, so a crafted link can't send someone elsewhere
// after they sign in.
export function safeNext(next: unknown, fallback = "/capture") {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
