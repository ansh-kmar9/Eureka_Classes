-- Eureka Classes: scheduled (scored, one-attempt) tests.
-- Run in the Supabase SQL Editor after 0006. Safe to re-run.

do $$ begin
  create type public.scheduled_status as enum ('draft', 'scheduled', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- A scheduled test runs in one fixed window: starts_at to starts_at + duration.
-- ---------------------------------------------------------------------------
create table if not exists public.scheduled_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  class smallint not null check (class between 6 and 12),
  stream public.stream_type,
  starts_at timestamptz not null,
  duration_minutes smallint not null check (duration_minutes between 5 and 300),
  status public.scheduled_status not null default 'draft',
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint scheduled_tests_stream_only_senior check (stream is null or class >= 11)
);

create index if not exists scheduled_tests_class_idx on public.scheduled_tests (class, starts_at);

-- Questions and their answer keys live in separate tables. Students have no access to either:
-- the server hands questions out only while an attempt is running, and marks the answers itself.
create table if not exists public.scheduled_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.scheduled_tests (id) on delete cascade,
  position integer not null default 0,
  text text not null check (char_length(btrim(text)) between 1 and 1000),
  options text[] not null,
  created_at timestamptz not null default now(),
  constraint scheduled_questions_four_options check (
    cardinality(options) = 4
    and btrim(options[1]) <> '' and btrim(options[2]) <> ''
    and btrim(options[3]) <> '' and btrim(options[4]) <> ''
  )
);

create index if not exists scheduled_questions_test_idx on public.scheduled_questions (test_id, position);

create table if not exists public.scheduled_answer_keys (
  question_id uuid primary key references public.scheduled_questions (id) on delete cascade,
  correct smallint not null check (correct between 0 and 3)
);

-- ---------------------------------------------------------------------------
-- Attempts: one per student per test, created and changed only by the server.
-- ---------------------------------------------------------------------------
create table if not exists public.scheduled_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.scheduled_tests (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  -- When the test window closes; a student who joins late has less time, never more.
  deadline_at timestamptz not null,
  submitted_at timestamptz,
  answers smallint[] not null default '{}',
  strikes smallint not null default 0 check (strikes >= 0),
  score smallint,
  total smallint,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
  -- How it ended: manual, time, fullscreen_exit, navigation, strikes, expired.
  submit_reason text check (submit_reason is null or char_length(submit_reason) <= 30),
  created_at timestamptz not null default now(),
  -- The one-attempt rule, enforced by the database itself.
  unique (test_id, student_id)
);

create index if not exists scheduled_attempts_student_idx on public.scheduled_attempts (student_id);

-- ---------------------------------------------------------------------------
-- Guards
-- ---------------------------------------------------------------------------
create or replace function public.guard_scheduled_question_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  target uuid;
begin
  if tg_op = 'DELETE' then
    target := old.test_id;
  else
    target := new.test_id;
  end if;

  -- Questions are locked once the test is scheduled or cancelled.
  if exists (select 1 from public.scheduled_tests where id = target and status <> 'draft') then
    raise exception 'Questions can only be changed while the test is a draft' using errcode = '23514';
  end if;
  if tg_op = 'INSERT'
     and (select count(*) from public.scheduled_questions where test_id = target) >= 100 then
    raise exception 'A scheduled test can have at most 100 questions' using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.guard_scheduled_test_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.status = 'cancelled' then
    raise exception 'A cancelled test cannot be changed' using errcode = '23514';
  end if;

  if old.status = 'scheduled' and new.status = 'draft' then
    raise exception 'A scheduled test cannot go back to draft' using errcode = '23514';
  end if;

  -- Once scheduled, who takes it and when is fixed.
  if old.status <> 'draft' and (
       new.class is distinct from old.class
    or new.stream is distinct from old.stream
    or new.starts_at is distinct from old.starts_at
    or new.duration_minutes is distinct from old.duration_minutes
  ) then
    raise exception 'A scheduled test can only be cancelled, not edited' using errcode = '23514';
  end if;

  if old.status = 'draft' and new.status = 'scheduled' then
    if not exists (select 1 from public.scheduled_questions where test_id = new.id) then
      raise exception 'Add at least one question before scheduling' using errcode = '23514';
    end if;
    if new.starts_at <= now() then
      raise exception 'The start time must be in the future' using errcode = '23514';
    end if;
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled' then
    new.cancelled_at := now();
  end if;
  return new;
end;
$$;

revoke all on function public.guard_scheduled_question_change(), public.guard_scheduled_test_change()
  from public, anon, authenticated;

drop trigger if exists scheduled_questions_guard on public.scheduled_questions;
create trigger scheduled_questions_guard
  before insert or update or delete on public.scheduled_questions
  for each row execute function public.guard_scheduled_question_change();

drop trigger if exists scheduled_tests_guard on public.scheduled_tests;
create trigger scheduled_tests_guard
  before update on public.scheduled_tests
  for each row execute function public.guard_scheduled_test_change();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.scheduled_tests enable row level security;
alter table public.scheduled_questions enable row level security;
alter table public.scheduled_answer_keys enable row level security;
alter table public.scheduled_attempts enable row level security;

-- Students see scheduled and cancelled tests of their own class (and stream), never drafts.
drop policy if exists "scheduled tests read" on public.scheduled_tests;
create policy "scheduled tests read" on public.scheduled_tests
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      status in ('scheduled', 'cancelled')
      and (select public.has_access())
      and class = (select public.my_class())
      and (stream is null or stream = (select public.my_stream()))
    )
  );

drop policy if exists "scheduled tests staff write" on public.scheduled_tests;
create policy "scheduled tests staff write" on public.scheduled_tests
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- Questions and keys: staff only. Students get them from the server during an attempt.
drop policy if exists "scheduled questions staff" on public.scheduled_questions;
create policy "scheduled questions staff" on public.scheduled_questions
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop policy if exists "scheduled keys staff" on public.scheduled_answer_keys;
create policy "scheduled keys staff" on public.scheduled_answer_keys
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop policy if exists "scheduled attempts read" on public.scheduled_attempts;
create policy "scheduled attempts read" on public.scheduled_attempts
  for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.scheduled_tests to authenticated;
grant select, insert, update, delete on public.scheduled_questions to authenticated;
grant select, insert, update, delete on public.scheduled_answer_keys to authenticated;
grant select on public.scheduled_attempts to authenticated;
