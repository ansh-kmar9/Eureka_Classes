-- Tracks when an AI analysis was made, so each student's usage can be limited.
-- Run in the Supabase SQL Editor after 0007. Safe to re-run.
alter table public.practice_attempts
  add column if not exists ai_analyzed_at timestamptz;
