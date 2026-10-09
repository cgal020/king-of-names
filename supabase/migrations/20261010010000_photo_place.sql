-- Where a photo was taken, as shown in the photo viewer ("Dubai Marina, Dubai").
-- Looked up once with Mapbox's permanent geocoding when the photo is saved.
alter table public.photos
  add column place_label text check (length(place_label) <= 200);
