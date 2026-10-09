# King of Names

A mobile-first progressive web app for remembering everyone you meet. Record a
short voice note and the app stamps the place and date, transcribes it, and
fills in a profile. The name lives in `lib/config.ts` and
`NEXT_PUBLIC_APP_NAME`.

Stack: Next.js (App Router, TypeScript), Tailwind CSS with shadcn/ui, Supabase
(Postgres, Auth, Storage), OpenAI transcription, Anthropic extraction, Mapbox,
hosted on Vercel. Decisions and deviations from the brief are in
[DECISIONS.md](DECISIONS.md).

## Setup

Requirements: Node 20.12 or later (developed on Node 24) and npm.

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment variables](#environment-variables)),
apply the database migrations, then:

```bash
npm run dev
```

Microphone and location only work over HTTPS or on `localhost`. To test on a
phone, use a Vercel preview deployment.

## Environment variables

| Variable | Where it is used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser and server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser and server | The publishable key (`sb_publishable_...`) or legacy anon key. Safe to expose; row level security protects the data |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | The secret key (`sb_secret_...`) or legacy service_role key. Bypasses row level security; used only for invite codes, username login and account deletion |
| `OPENAI_API_KEY` | server only | Transcription |
| `TRANSCRIPTION_MODEL` | server only | OpenAI transcription model ID; `gpt-transcribe` recommended |
| `TRANSCRIPTION_LANGUAGES` | server only | Comma-separated languages notes are spoken in, default `en` |
| `ANTHROPIC_API_KEY` | server only | Field extraction |
| `EXTRACTION_MODEL` | server only | Anthropic model ID for extraction and card reading; `claude-haiku-4-5` recommended |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | browser | Public token for drawing maps. Restrict it to the production and preview URLs in the Mapbox dashboard |
| `MAPBOX_SERVER_TOKEN` | server only | Reverse geocoding: the stored place (permanent geocoding, needs a card on the Mapbox account) and the place shown while recording (temporary, free tier) |
| `NEXT_PUBLIC_APP_NAME` | browser and server | Display name, defaults to King of Names |
| `NEXT_PUBLIC_SITE_URL` | server | The app's public address, used in password reset links. Optional locally |

## Database

Migrations live in `supabase/migrations` and are plain SQL. Apply them with the
Supabase CLI (run through npx, no global install needed):

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`<project-ref>` is the ID in the project URL (`https://<project-ref>.supabase.co`).
Link the dev project while developing and the production project when
releasing. Every table has row level security; `invite_codes` has no client
access at all.

### First invite code

Sign-up needs an unused invite code. Create the first one with the service
role key from `.env.local`:

```bash
npm run invite:create
```

## Running tests

```bash
npm run lint
npm run typecheck
npm test                  # unit tests, offline
npm run test:integration  # row level security test against the Supabase project in .env.local
npm run eval:extraction   # 13 sample notes through the real extraction model (costs a few cents)
npm run check:pwa         # recording, offline queue, shortcut, manifest and install help in Chrome (dev server running)
```

To include the service worker, check a production build:

```bash
npm run build && npm start -- -p 3100
PWA_BASE_URL=http://localhost:3100 npm run check:pwa -- --prod
```

The integration test creates two throwaway users, checks that neither can see
or change the other's people, captures, profile or audio, then deletes them.
Point it at the dev project, never production.

## Claude and ChatGPT connector (MCP)

`app/api/mcp/route.ts` is a read-only MCP server with four tools: `search_people`, `get_person`, `coming_up` and `people_near` (defined in `lib/mcp/people-tools.ts`). In development it serves the sample data without sign-in; in production it returns 404 until OAuth is wired up.

Try it locally with Claude Code while `npm run dev` is running:

```bash
claude mcp add --transport http king-of-names-dev http://localhost:3000/api/mcp
```

Then ask Claude something like "Who are my investors in Dubai?". Claude.ai and ChatGPT need a public HTTPS URL with OAuth, so they can connect once the app is deployed with Supabase Auth's OAuth 2.1 server (see DECISIONS.md).

## Installable app and offline

- `app/manifest.ts` is the web app manifest. Icons are generated, not hand-made: edit the design in `scripts/build-icons.mts` and run `npm run icons`.
- `public/sw.js` is the service worker. It registers in production builds only and keeps just the Capture screen and the offline page, so the app opens without a connection. Change `VERSION` in it when its caching rules change.
- Notes recorded without a connection wait in IndexedDB (`lib/offline/queue.ts`) and are sent when the app is next online.
- The service worker only runs over HTTPS or on `localhost`, so test installing on a phone with a Vercel preview deployment.

## Screenshots for design reviews

```bash
npm run screenshots
```

Captures every screen and state at phone size, light and dark, into `docs/design-handoff/screens/`. Needs the dev server running and Google Chrome installed.

## Deployment

Hosted on Vercel, functions in Singapore (`sin1`, set in `vercel.json`) next to
the Supabase project in `ap-southeast-1`.

1. Import the GitHub repo into Vercel.
2. Add every variable from `.env.example` for Production and Preview.
3. Apply migrations to the production Supabase project (see [Database](#database)).
4. In Supabase Auth settings, set the Site URL to the production URL and add
   the preview URL pattern to the redirect allow list.
5. In Supabase Authentication > Sign In / Providers, turn off "Allow new users
   to sign up". Accounts are created by the server after it checks the invite
   code; leaving public sign-up on would let anyone with the public key skip
   the invite.
6. Set custom SMTP (Resend) under Authentication > Emails, and change the
   "Reset password" template's link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
