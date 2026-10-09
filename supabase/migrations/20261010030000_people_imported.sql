-- People who came in from a contacts import. Their met_at is the import time
-- and means "date unknown": the app shows "Imported from contacts" instead,
-- and one import can be undone by deleting the people with its timestamp.
-- Cleared once a real meeting is recorded or the date is set by hand.
alter table public.people add column imported_at timestamptz;

create index people_user_imported_idx on public.people (user_id, imported_at) where imported_at is not null;
