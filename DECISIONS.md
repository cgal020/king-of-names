# Decisions

One line per meaningful decision or deviation from the brief, newest last.

- 2026-10-06: All provider accounts (Supabase, Vercel, GitHub, OpenAI, Anthropic, Mapbox) are owned by Cameron.
- 2026-10-06: Region is Singapore (Supabase `ap-southeast-1`, Vercel `sin1`): the best single compromise between Dubai, Australia and Thailand.
- 2026-10-06: Next.js 16 calls its middleware file `proxy.ts`; Supabase session refresh lives there.
- 2026-10-06: Supabase's new "publishable" and "secret" keys go into the brief's `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` variables; legacy anon and service_role keys also work.
- 2026-10-06: No Docker on the dev machine, so development uses a hosted Supabase dev project; production is a separate project.
- 2026-10-06: Profiles are created by a trigger on `auth.users` from sign-up metadata, so a user can never exist without a profile.
- 2026-10-06: `captures` gains `geocode` (jsonb) and `recorded_timezone` columns so a draft can be reopened after a closed tab without re-billing Mapbox.
- 2026-10-06: `people` gains a generated `search_text` column (name, notes, where met, place, city) with a trigram index; search is `ilike` on that column.
- 2026-10-06: The RLS test runs against the dev project (`npm run test:integration`), separate from the offline unit tests (`npm test`).
- 2026-10-06: Login accepts username or email; a server route looks up the email for a username and returns a generic error on failure.
- 2026-10-06: Sign-up skips email confirmation because invite codes already gate access. Password reset email goes through a custom SMTP provider (Resend by default); Supabase's built-in email only reaches project team members.
- 2026-10-06: Reverse geocoding uses Mapbox `permanent=true` because results are stored. It has no free tier ($5 per 1,000 lookups at the time of writing) and needs a card on Cameron's Mapbox account.
- 2026-10-06: Rate limit (60 captures per hour per user) counts the user's `captures` rows from the last hour. No Redis.
- 2026-10-06: Recording duration is reported by the device and checked against the 90 s cap plus a 10 MB size cap; the server does not decode audio.
- 2026-10-06: Audio is uploaded with its base MIME type (for example `audio/webm`, without `;codecs=opus`) to match the bucket's allowed types.
- 2026-10-06: Placeholder name "PeopleMap" with a muted green accent, both set in `lib/config.ts`.
- 2026-10-06: Built a clickable mockup of Capture, Review, People, Profile, Map and Settings with sample data (`lib/mock/`) before milestones 2 to 7, at Ann's request, to review look and flow. Screens and components are the real ones; milestones 2 to 7 replace the sample data with Supabase and delete `lib/mock/`.
- 2026-10-06: Design direction "quiet utility" (Apple Notes, Things), avoid corporate-CRM feel; recorded in PRODUCT.md.
- 2026-10-06: System font stack instead of a web font: native feel on iPhone and Android, nothing to download, works offline.
- 2026-10-06: Optional fields (phone, birthday, follow-up, company, email) stay hidden behind "+" chips until they have a value, so review is a glance rather than a form.
