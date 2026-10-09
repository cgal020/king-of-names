-- Event mode: an event groups the quick takes recorded during it. Each take is
-- a normal capture with event_id set; it goes through the same pipeline and
-- waits in "needs review" until the user saves or discards it.
-- Added on 2026-10-09 (see DECISIONS.md).

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  started_at timestamptz not null default now(),
  -- Null while the event is running.
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint events_ends_after_start check (ended_at is null or ended_at >= started_at),
  constraint events_id_user_unique unique (id, user_id)
);

-- At most one running event per user.
create unique index events_one_running_idx on public.events (user_id) where ended_at is null;
create index events_user_started_idx on public.events (user_id, started_at desc);

alter table public.events enable row level security;

create policy "events: read own" on public.events
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "events: insert own" on public.events
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "events: update own" on public.events
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "events: delete own" on public.events
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- A take can only belong to the same user's event. Deleting an event keeps
-- its takes as ordinary notes.
alter table public.captures
  add column event_id uuid,
  add constraint captures_event_same_user foreign key (event_id, user_id)
    references public.events (id, user_id) on delete set null (event_id);

create index captures_event_idx on public.captures (event_id) where event_id is not null;
