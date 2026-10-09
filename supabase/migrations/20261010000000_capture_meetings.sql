-- Saved notes are meetings. The note that created a person is how you first
-- met them; any later note linked to them is a later meeting. A "Met again"
-- note typed on a profile is a capture with no audio, its text in transcript.

alter table public.captures
  add column first_meeting boolean not null default false;

-- Meetings for one person, newest first, for the profile timeline.
create index captures_person_recorded_idx on public.captures (person_id, recorded_at desc)
  where person_id is not null;
