# PeopleMap

A mobile-first progressive web app for remembering everyone you meet. Record a
short voice note and the app stamps the place and date, transcribes it, and
fills in a profile. "PeopleMap" is a placeholder name; change it in
`lib/config.ts` and `NEXT_PUBLIC_APP_NAME`.

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
| `TRANSCRIPTION_MODEL` | server only | OpenAI transcription model ID |
| `ANTHROPIC_API_KEY` | server only | Field extraction |
| `EXTRACTION_MODEL` | server only | Anthropic model ID |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | browser | Public token for drawing maps. Restrict it to the production and preview URLs in the Mapbox dashboard |
| `MAPBOX_SERVER_TOKEN` | server only | Reverse geocoding. Needs a card on the Mapbox account because results are stored (`permanent=true`) |
| `NEXT_PUBLIC_APP_NAME` | browser and server | Display name, defaults to PeopleMap |

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
```

The integration test creates two throwaway users, checks that neither can see
or change the other's people, captures, profile or audio, then deletes them.
Point it at the dev project, never production.

## Deployment

Hosted on Vercel, functions in Singapore (`sin1`, set in `vercel.json`) next to
the Supabase project in `ap-southeast-1`.

1. Import the GitHub repo into Vercel.
2. Add every variable from `.env.example` for Production and Preview.
3. Apply migrations to the production Supabase project (see [Database](#database)).
4. In Supabase Auth settings, set the Site URL to the production URL and add
   the preview URL pattern to the redirect allow list.
