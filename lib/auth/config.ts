// Sign-in needs a Supabase project. Until its keys are set, the app runs as a
// preview: the sign-in screens check what's typed, then open the sample app.
export function authConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
