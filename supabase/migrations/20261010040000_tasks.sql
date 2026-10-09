-- Tasks and reminders for a person: as many as you like, each with an
-- optional due date, ticked off when done. Only the owner can see or change
-- them, and they go when the person is deleted.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  person_id uuid not null,
  title text not null check (length(title) between 1 and 300),
  due_date date,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  constraint tasks_person_same_user foreign key (person_id, user_id)
    references public.people (id, user_id) on delete cascade
);

create index tasks_user_open_idx on public.tasks (user_id, due_date) where done_at is null;
create index tasks_person_idx on public.tasks (person_id);

alter table public.tasks enable row level security;

create policy "tasks: read own" on public.tasks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "tasks: insert own" on public.tasks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "tasks: update own" on public.tasks
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "tasks: delete own" on public.tasks
  for delete to authenticated using (user_id = (select auth.uid()));
