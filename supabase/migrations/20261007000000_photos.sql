-- Photos: of the person, their business card, or the moment and place.
-- Added to Phase 1 on 2026-10-07 (see DECISIONS.md).

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Null while the photo belongs to an unconfirmed capture draft.
  person_id uuid,
  capture_id uuid,
  kind text not null default 'moment' check (kind in ('person', 'card', 'moment')),
  storage_path text not null,
  mime text not null,
  width integer check (width > 0),
  height integer check (height > 0),
  bytes integer check (bytes > 0),
  taken_at timestamptz,
  -- IANA zone of the device when the photo was taken, so times show as local.
  taken_timezone text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  location_accuracy_m real,
  -- device: phone GPS when the photo was taken in the app.
  -- photo: GPS saved inside a library photo. none: no location available.
  location_source text not null default 'none' check (location_source in ('device', 'photo', 'none')),
  created_at timestamptz not null default now(),
  constraint photo_lat_lng_together check ((lat is null) = (lng is null)),
  constraint photo_belongs_somewhere check (person_id is not null or capture_id is not null),
  -- Photos can only be linked to the same user's people and captures.
  constraint photos_person_same_user foreign key (person_id, user_id)
    references public.people (id, user_id) on delete cascade,
  constraint photos_capture_same_user foreign key (capture_id, user_id)
    references public.captures (id, user_id) on delete set null (capture_id)
);

create index photos_person_idx on public.photos (person_id, created_at desc);
create index photos_capture_idx on public.photos (capture_id);
create index photos_user_idx on public.photos (user_id);

alter table public.photos enable row level security;

create policy "photos: read own" on public.photos
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "photos: insert own" on public.photos
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "photos: update own" on public.photos
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "photos: delete own" on public.photos
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Private bucket. Object paths are "<user_id>/<photo_id>.jpg". The client
-- re-encodes every photo to JPEG (max 2048 px), which also strips EXIF.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "photos: read own objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "photos: insert own objects" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "photos: update own objects" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "photos: delete own objects" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
