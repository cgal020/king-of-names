-- Your QR codes. Each opens /q/<slug>; the app sends whoever scans it on to
-- the code's current destination, so it can change after the code is printed.
-- Only the owner can see or change their codes. The /q redirect reads a code
-- by slug and counts the scan with the service role, server side.

create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]{8}$'),
  label text not null check (length(label) between 1 and 40),
  -- { purpose, ...fields }, checked by the app (lib/qr/codes.ts).
  destination jsonb not null check (destination ? 'purpose'),
  scan_count integer not null default 0 check (scan_count >= 0),
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index qr_codes_user_idx on public.qr_codes (user_id, created_at);

create trigger qr_codes_set_updated_at
  before update on public.qr_codes
  for each row execute function public.set_updated_at();

alter table public.qr_codes enable row level security;

create policy "qr_codes: read own" on public.qr_codes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "qr_codes: insert own" on public.qr_codes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "qr_codes: update own" on public.qr_codes
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "qr_codes: delete own" on public.qr_codes
  for delete to authenticated using (user_id = (select auth.uid()));

-- Counts a scan without a read-modify-write race.
create or replace function public.count_qr_scan(scanned_slug text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.qr_codes
  set scan_count = scan_count + 1, last_scanned_at = now()
  where slug = scanned_slug;
$$;
revoke all on function public.count_qr_scan(text) from public, anon, authenticated;
grant execute on function public.count_qr_scan(text) to service_role;
