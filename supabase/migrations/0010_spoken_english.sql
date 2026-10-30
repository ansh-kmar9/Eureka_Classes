-- Eureka Classes: Spoken English progress (lessons finished, XP log for streaks).
-- The course content itself lives in the app code. Run in the Supabase SQL Editor after 0009.
-- Safe to re-run.

-- One row per lesson a student has finished: the best result so far.
create table if not exists public.spoken_progress (
  student_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null check (lesson_id ~ '^[0-9]{1,2}-[0-9]{1,2}-[0-9]{1,2}$'),
  stars smallint not null check (stars between 1 and 3),
  best_percent smallint not null check (best_percent between 0 and 100),
  attempts integer not null default 1 check (attempts >= 1),
  first_completed_at timestamptz not null default now(),
  last_completed_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

-- Every time XP is earned. Total XP and the daily streak are worked out from this log.
create table if not exists public.spoken_activity (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('lesson', 'practice')),
  ref text check (ref is null or char_length(ref) <= 20),
  xp smallint not null check (xp between 0 and 200),
  -- The calendar day in India, so a streak does not break at the wrong midnight.
  day date not null,
  created_at timestamptz not null default now()
);

create index if not exists spoken_activity_student_idx on public.spoken_activity (student_id, day);

alter table public.spoken_progress enable row level security;
alter table public.spoken_activity enable row level security;

-- Students read their own progress; teachers can read everyone's.
-- There are no write policies on purpose: only the server records progress, so XP cannot be forged.
drop policy if exists "spoken progress read" on public.spoken_progress;
create policy "spoken progress read" on public.spoken_progress
  for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_staff()));

drop policy if exists "spoken activity read" on public.spoken_activity;
create policy "spoken activity read" on public.spoken_activity
  for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_staff()));

grant select on public.spoken_progress to authenticated;
grant select on public.spoken_activity to authenticated;
