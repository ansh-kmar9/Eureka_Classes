-- Eureka Classes: board (CBSE / BSEB), fixed subject and topic catalog, practice tests per topic.
-- Run in the Supabase SQL Editor after 0004. Replaces the practice-test tables from 0004
-- (they were empty). Safe to re-run.

-- ---------------------------------------------------------------------------
-- Board
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.board_type as enum ('cbse', 'bseb');
exception when duplicate_object then null; end $$;

alter table public.profiles add column if not exists board public.board_type;
alter table public.class_change_requests add column if not exists to_board public.board_type;

create or replace function public.my_board()
returns public.board_type language sql stable security definer set search_path = ''
as $$
  select board from public.profiles where id = auth.uid();
$$;

revoke all on function public.my_board() from public, anon;
grant execute on function public.my_board() to authenticated;

-- Profile guard: board follows the same rule as class. A student may set it while the profile
-- is incomplete or pending, or once if it is still empty. After that a teacher approves changes.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  actor_is_staff boolean;
begin
  if actor is null then
    new.updated_at := now();
    return new;
  end if;

  new.id := old.id;
  new.email := old.email;
  new.created_at := old.created_at;
  new.approved_at := old.approved_at;
  new.approved_by := old.approved_by;

  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only the admin can change roles' using errcode = '42501';
  end if;

  actor_is_staff := public.is_staff();

  if actor_is_staff and actor <> old.id then
    if old.role <> 'student' and not public.is_admin() then
      raise exception 'Only the admin can edit staff accounts' using errcode = '42501';
    end if;
    if new.status = 'approved' and old.status = 'incomplete' and new.role = 'student' then
      raise exception 'The student has not completed their profile' using errcode = '23514';
    end if;
  elsif not actor_is_staff then
    if new.status is distinct from old.status then
      if not (old.status = 'incomplete' and new.status = 'pending') then
        raise exception 'Only a teacher can change enrolment status' using errcode = '42501';
      end if;
      if new.full_name is null or btrim(new.full_name) = ''
         or new.class is null or new.age is null or new.mobile is null
         or new.board is null then
        raise exception 'Complete all profile fields first' using errcode = '23514';
      end if;
    end if;
    if (new.class is distinct from old.class or new.stream is distinct from old.stream)
       and old.status not in ('incomplete', 'pending') then
      raise exception 'Class changes need teacher approval' using errcode = '42501';
    end if;
    if new.board is distinct from old.board
       and old.board is not null
       and old.status not in ('incomplete', 'pending') then
      raise exception 'Board changes need teacher approval' using errcode = '42501';
    end if;
  end if;

  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := coalesce(old.approved_at, now());
    new.approved_by := actor;
  end if;

  new.updated_at := now();
  return new;
end;
$fn$;

-- A class-change decision can also change the board.
create or replace function public.decide_class_change(request_id uuid, approve boolean)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  req public.class_change_requests;
begin
  if not public.is_staff() then
    raise exception 'Only teachers can decide class changes' using errcode = '42501';
  end if;

  select * into req from public.class_change_requests
  where id = request_id and status = 'pending' for update;

  if not found then
    raise exception 'Request not found or already decided' using errcode = 'P0002';
  end if;

  if approve then
    update public.profiles
    set class = req.to_class,
        stream = req.to_stream,
        board = coalesce(req.to_board, board)
    where id = req.student_id;
  end if;

  update public.class_change_requests
  set status = (case when approve then 'approved' else 'rejected' end)::public.request_status,
      decided_by = auth.uid(),
      decided_at = now()
  where id = request_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixed catalog: subjects per board, class and stream; topics (chapters) per subject.
-- A NULL stream below class 11 is normal; at 11 and 12 it means "every stream".
-- ---------------------------------------------------------------------------
create table if not exists public.catalog_subjects (
  id uuid primary key default gen_random_uuid(),
  board public.board_type not null,
  class smallint not null check (class between 6 and 12),
  stream public.stream_type,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint catalog_subjects_stream_only_senior check (stream is null or class >= 11)
);

-- NULLS NOT DISTINCT makes two rows with no stream count as the same stream (needs Postgres 15+).
create unique index if not exists catalog_subjects_unique_idx
  on public.catalog_subjects (board, class, stream, lower(name)) nulls not distinct;

create table if not exists public.catalog_topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.catalog_subjects (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists catalog_topics_unique_idx
  on public.catalog_topics (subject_id, lower(name));
create index if not exists catalog_topics_subject_idx on public.catalog_topics (subject_id, position);

alter table public.catalog_subjects enable row level security;
alter table public.catalog_topics enable row level security;

-- Students see active subjects for their own board, class and stream.
drop policy if exists "catalog subjects read" on public.catalog_subjects;
create policy "catalog subjects read" on public.catalog_subjects
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      (select public.has_access())
      and is_active
      and board = (select public.my_board())
      and class = (select public.my_class())
      and (stream is null or stream = (select public.my_stream()))
    )
  );

drop policy if exists "catalog subjects staff write" on public.catalog_subjects;
create policy "catalog subjects staff write" on public.catalog_subjects
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- A topic is visible when it is active and its subject is visible (the subquery applies that policy).
drop policy if exists "catalog topics read" on public.catalog_topics;
create policy "catalog topics read" on public.catalog_topics
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      is_active
      and exists (select 1 from public.catalog_subjects s where s.id = subject_id)
    )
  );

drop policy if exists "catalog topics staff write" on public.catalog_topics;
create policy "catalog topics staff write" on public.catalog_topics
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Practice tests are rebuilt: exactly one per catalog topic.
-- ---------------------------------------------------------------------------
drop table if exists public.practice_attempts cascade;
drop table if exists public.questions cascade;
drop table if exists public.practice_tests cascade;

create table public.practice_tests (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null unique references public.catalog_topics (id) on delete cascade,
  duration_minutes smallint not null default 30 check (duration_minutes between 5 and 180),
  is_published boolean not null default false,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.practice_tests (id) on delete cascade,
  position integer not null default 0,
  text text not null check (char_length(btrim(text)) between 1 and 1000),
  options text[] not null,
  correct smallint not null check (correct between 0 and 3),
  explanation text check (explanation is null or char_length(explanation) <= 1000),
  created_at timestamptz not null default now(),
  constraint questions_four_options check (
    cardinality(options) = 4
    and btrim(options[1]) <> '' and btrim(options[2]) <> ''
    and btrim(options[3]) <> '' and btrim(options[4]) <> ''
  )
);

create index questions_test_idx on public.questions (test_id, position);

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

create trigger questions_guard_insert before insert on public.questions
  for each row execute function public.guard_question_insert();
create trigger questions_guard_delete before delete on public.questions
  for each row execute function public.guard_question_delete();
create trigger practice_tests_guard_publish before update on public.practice_tests
  for each row execute function public.guard_test_publish();

alter table public.practice_tests enable row level security;
alter table public.questions enable row level security;

-- A student sees a published test only when its topic is visible to them
-- (right board, class and stream).
create policy "practice tests read" on public.practice_tests
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      is_published
      and (select public.has_access())
      and exists (select 1 from public.catalog_topics t where t.id = topic_id)
    )
  );

create policy "practice tests staff write" on public.practice_tests
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- The answer is included on purpose: practice tests are downloaded for offline use and marked there.
create policy "questions read" on public.questions
  for select to authenticated
  using (exists (select 1 from public.practice_tests t where t.id = test_id));

create policy "questions staff write" on public.questions
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Attempts (written only by the server, which marks the answers itself)
-- ---------------------------------------------------------------------------
create table public.practice_attempts (
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
  unique (student_id, client_id)
);

create index practice_attempts_student_idx on public.practice_attempts (student_id, test_id);

alter table public.practice_attempts enable row level security;

create policy "attempts read own or staff" on public.practice_attempts
  for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Leaderboard: same class AND same board, since the tests differ between boards.
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
    select class, board from public.profiles
    where id = auth.uid() and class is not null and board is not null and public.has_access()
  ),
  best as (
    select a.student_id, a.test_id, max(a.score) as best_score
    from public.practice_attempts a
    join public.profiles p on p.id = a.student_id
    join me on p.class = me.class and p.board = me.board
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
grant select, insert, update, delete on public.catalog_subjects to authenticated;
grant select, insert, update, delete on public.catalog_topics to authenticated;
grant select, insert, update, delete on public.practice_tests to authenticated;
grant select, insert, update, delete on public.questions to authenticated;
grant select on public.practice_attempts to authenticated;
