-- Remembers when each person last opened the announcements list, to show an "unread" dot.
-- Run in the Supabase SQL Editor. Safe to re-run.
alter table public.profiles
  add column if not exists announcements_seen_at timestamptz;
