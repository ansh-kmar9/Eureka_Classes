-- Eureka Classes: practice test series, attempts, leaderboard, badges.
-- Run in the Supabase SQL Editor after 0003. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Practice tests: one test per topic, 20 MCQs, 30 minutes by default.
-- ---------------------------------------------------------------------------
create table if not exists public.practice_tests (
  id uuid primary key default gen_random_uuid(),
  class smallint not null check (class between 6 and 12),
  stream public.stream_type,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  topic text not null check (char_length(btrim(topic)) between 1 and 120),
  duration_minutes smallint not null default 30 check (duration_minutes between 5 and 180),
  is_published boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint practice_tests_stream_only_senior check (stream is null or class >= 11)
);

create index if not exists practice_tests_class_idx on public.practice_tests (class, stream);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.practice_tests (id) on delete cascade,
  position integer not null default 0,
  text text not null check (char_length(btrim(text)) between 1 and 1000),
  options text[] not null,
  correct smallint not null check (correct between 0 and 3),
  explanation text check (explanation is null or char_length(explanation) <= 1000),
  created_at timestamptz not null default now(),
  -- Exactly four non-empty options.
  constraint questions_four_options check (
    cardinality(options) = 4
    and btrim(options[1]) <> '' and btrim(options[2]) <> ''
    and btrim(options[3]) <> '' and btrim(options[4]) <> ''
  )
);

create index if not exists questions_test_idx on public.questions (test_id, position);

-- A test holds at most 20 questions, and must hold exactly 20 to be published.
create or replace function public.guard_question_insert()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.questions where test_id = new.test_id) >= 20 then
    raise exception 'A test can have at most 20 questions' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.guard_question_delete()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  -- Cascading deletes of a whole test are fine; removing one question from a live test is not.
  if exists (select 1 from public.practice_tests where id = old.test_id and is_published) then
    raise exception 'Unpublish the test before removing questions' using errcode = '23514';
  end if;
  return old;
end;
$$;

create or replace function public.guard_test_publish()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.is_published and not old.is_published
     and (select count(*) from public.questions where test_id = new.id) <> 20 then
    raise exception 'A test needs exactly 20 questions before it can be published' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_question_insert(), public.guard_question_delete(), public.guard_test_publish()
  from public, anon, authenticated;

drop trigger if exists questions_guard_insert on public.questions;
create trigger questions_guard_insert before insert on public.questions
  for each row execute function public.guard_question_insert();

drop trigger if exists questions_guard_delete on public.questions;
create trigger questions_guard_delete before delete on public.questions
  for each row execute function public.guard_question_delete();

drop trigger if exists practice_tests_guard_publish on public.practice_tests;
create trigger practice_tests_guard_publish before update on public.practice_tests
  for each row execute function public.guard_test_publish();

alter table public.practice_tests enable row level security;
alter table public.questions enable row level security;

-- Students see published tests for their own class and stream only.
drop policy if exists "practice tests read" on public.practice_tests;
create policy "practice tests read" on public.practice_tests
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      is_published
      and (select public.has_access())
      and class = (select public.my_class())
      and (stream is null or stream = (select public.my_stream()))
    )
  );

drop policy if exists "practice tests staff write" on public.practice_tests;
create policy "practice tests staff write" on public.practice_tests
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- Questions follow the visibility of their test. The answer is included on purpose:
-- practice tests are downloaded for offline use and marked on the device.
drop policy if exists "questions read" on public.questions;
create policy "questions read" on public.questions
  for select to authenticated
  using (exists (select 1 from public.practice_tests t where t.id = test_id));

drop policy if exists "questions staff write" on public.questions;
create policy "questions staff write" on public.questions
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Attempts. Written only by the server, which marks the answers itself,
-- so a score can never be sent in by the browser.
-- ---------------------------------------------------------------------------
create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  test_id uuid not null references public.practice_tests (id) on delete cascade,
  answers smallint[] not null,
  score smallint not null check (score >= 0),
  total smallint not null check (total > 0),
  duration_seconds integer not null check (duration_seconds >= 0),
  client_id uuid not null,
  ai_analysis text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- Makes retries and offline sync safe: the same attempt is never counted twice.
  unique (student_id, client_id)
);

create index if not exists practice_attempts_student_idx on public.practice_attempts (student_id, test_id);

alter table public.practice_attempts enable row level security;

drop policy if exists "attempts read own or staff" on public.practice_attempts;
create policy "attempts read own or staff" on public.practice_attempts
  for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Badges (awarded by the server)
-- ---------------------------------------------------------------------------
create table if not exists public.student_badges (
  student_id uuid not null references public.profiles (id) on delete cascade,
  badge text not null check (char_length(badge) between 1 and 40),
  earned_at timestamptz not null default now(),
  primary key (student_id, badge)
);

alter table public.student_badges enable row level security;

drop policy if exists "badges read own or staff" on public.student_badges;
create policy "badges read own or staff" on public.student_badges
  for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Leaderboard: a student's points are their best score on each test, added up.
-- Returns the top rows of the caller's class, plus the caller's own row.
-- ---------------------------------------------------------------------------
create or replace function public.class_leaderboard(limit_rows integer default 20)
returns table (
  rank bigint,
  student_id uuid,
  display_name text,
  avatar_url text,
  points bigint,
  tests_taken bigint,
  is_me boolean
)
language sql stable security definer set search_path = ''
as $$
  with me as (
    select class from public.profiles
    where id = auth.uid() and class is not null and public.has_access()
  ),
  best as (
    select a.student_id, a.test_id, max(a.score) as best_score
    from public.practice_attempts a
    join public.profiles p on p.id = a.student_id
    join me on p.class = me.class
    where p.role = 'student' and p.status = 'approved'
    group by a.student_id, a.test_id
  ),
  totals as (
    select student_id, sum(best_score) as points, count(*) as tests_taken
    from best group by student_id
  ),
  ranked as (
    select rank() over (order by points desc) as rnk, t.*
    from totals t
  )
  select
    r.rnk,
    r.student_id,
    -- First name and last initial: enough for classmates, without exposing full names.
    coalesce(nullif(split_part(btrim(p.full_name), ' ', 1), ''), 'Student')
      || coalesce(' ' || left(nullif(split_part(btrim(p.full_name), ' ', 2), ''), 1) || '.', ''),
    p.avatar_url,
    r.points,
    r.tests_taken,
    r.student_id = auth.uid()
  from ranked r
  join public.profiles p on p.id = r.student_id
  where r.rnk <= limit_rows or r.student_id = auth.uid()
  order by r.rnk, p.full_name;
$$;

revoke all on function public.class_leaderboard(integer) from public, anon;
grant execute on function public.class_leaderboard(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.practice_tests to authenticated;
grant select, insert, update, delete on public.questions to authenticated;
grant select on public.practice_attempts to authenticated;
grant select on public.student_badges to authenticated;
