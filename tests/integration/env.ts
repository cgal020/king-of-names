// Integration tests talk to a real Supabase project, configured in .env.local.
export function requireEnv() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Fall through to the check below; CI may provide the variables directly.
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    throw new Error(
      "Integration tests need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and " +
        "SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local, pointing at a dev project, never production.",
    );
  }

  return { url, anonKey, serviceKey };
}
