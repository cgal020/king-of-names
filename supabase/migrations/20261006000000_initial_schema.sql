-- Initial schema: profiles, people, captures, invite_codes, audio bucket.
-- Every table has row level security. Policies use (select auth.uid()) so the
-- function is evaluated once per statement instead of once per row.

create extension if not exists pg_trgm with schema extensions;

-- Shared trigger function for updated_at columns.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-------------------------------------------------------------------------------
-- profiles
-------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    constraint username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Profiles are created by this trigger, never by the client. Sign-up passes the
-- username in user metadata; a user created any other way (for example from the
-- dashboard) gets a placeholder username they can change in settings.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(
      lower(new.raw_user_meta_data ->> 'username'),
      'user_' || left(replace(new.id::text, '-', ''), 12)
    ),
    new.raw_user_meta_data ->> 'display_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-------------------------------------------------------------------------------
-- people
-------------------------------------------------------------------------------

-- array_to_string is only "stable", so generated columns cannot call it
-- directly. Joining a text array is deterministic, so this wrapper is safe.
create or replace function public.tags_text(tags text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(pg_catalog.array_to_string(tags, ' '), '')
$$;

create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  met_at timestamptz not null,
  met_timezone text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  location_accuracy_m real,
  place_name text,
  city text,
  region text,
  country text,
  where_met_text text,
  phone text,
  birthday_month smallint check (birthday_month between 1 and 12),
  birthday_day smallint check (birthday_day between 1 and 31),
  birthday_year smallint check (birthday_year between 1900 and 2100),
  notes text,
  follow_up_note text,
  follow_up_date date,
  extras jsonb not null default '{}'::jsonb,
  -- Business, personal or both; suggested by the AI, confirmed by the user.
  relationship text check (relationship in ('business', 'personal', 'both')),
  -- How they could help, e.g. {Investor, Logistics}. Free text, deduplicated
  -- case-insensitively by the app.
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lowercased text the search box matches against with ilike.
  search_text text generated always as (
    lower(
      coalesce(full_name, '') || ' ' ||
      coalesce(notes, '') || ' ' ||
      coalesce(where_met_text, '') || ' ' ||
      coalesce(place_name, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      public.tags_text(tags)
    )
  ) stored,
  constraint lat_lng_together check ((lat is null) = (lng is null)),
  -- Target for composite foreign keys, so rows can only link to the same user's people.
  constraint people_id_user_unique unique (id, user_id)
);

create index people_user_city_idx on public.people (user_id, city);
create index people_user_met_at_idx on public.people (user_id, met_at desc);
create index people_search_trgm_idx on public.people using gin (search_text extensions.gin_trgm_ops);
create index people_tags_idx on public.people using gin (tags);

create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

alter table public.people enable row level security;

create policy "people: read own" on public.people
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "people: insert own" on public.people
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "people: update own" on public.people
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "people: delete own" on public.people
  for delete to authenticated
  using (user_id = (select auth.uid()));

-------------------------------------------------------------------------------
-- captures
-------------------------------------------------------------------------------

create table public.captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  person_id uuid,
  audio_path text,
  audio_mime text,
  duration_seconds real,
  transcript text,
  extraction jsonb,
  -- Reverse geocode result, kept so a draft can be reopened without re-billing.
  geocode jsonb,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  location_accuracy_m real,
  recorded_at timestamptz,
  recorded_timezone text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'transcribed', 'extracted', 'confirmed', 'failed', 'discarded')),
  error text,
  created_at timestamptz not null default now(),
  -- A capture can only be linked to a person owned by the same user.
  constraint captures_person_same_user foreign key (person_id, user_id)
    references public.people (id, user_id) on delete set null (person_id),
  constraint captures_id_user_unique unique (id, user_id)
);

-- Serves the "Needs review" strip and the per-user hourly rate limit.
create index captures_user_status_idx on public.captures (user_id, status);
create index captures_user_created_idx on public.captures (user_id, created_at desc);
create index captures_person_idx on public.captures (person_id);

alter table public.captures enable row level security;

create policy "captures: read own" on public.captures
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "captures: insert own" on public.captures
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "captures: update own" on public.captures
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "captures: delete own" on public.captures
  for delete to authenticated
  using (user_id = (select auth.uid()));

-------------------------------------------------------------------------------
-- invite_codes: no client access at all. Only server routes using the
-- service role key read or consume codes.
-------------------------------------------------------------------------------

create table public.invite_codes (
  code text primary key check (length(code) >= 8),
  created_by uuid references public.profiles (id) on delete set null,
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index invite_codes_created_by_idx on public.invite_codes (created_by);

alter table public.invite_codes enable row level security;
revoke all on public.invite_codes from anon, authenticated;

-------------------------------------------------------------------------------
-- Storage: private "audio" bucket. Object paths are "<user_id>/<capture_id>.<ext>".
-------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  false,
  10485760, -- 10 MB, comfortably above 90 s of compressed speech
  array['audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/mpeg', 'audio/ogg', 'audio/wav']
)
on conflict (id) do nothing;

create policy "audio: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "audio: insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "audio: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "audio: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
