-- Eureka Classes: courses, lessons, progress, study material.
-- Run in the Supabase SQL Editor after 0001_core.sql. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.my_stream()
returns public.stream_type language sql stable security definer set search_path = ''
as $$
  select stream from public.profiles where id = auth.uid();
$$;

revoke all on function public.my_stream() from public, anon;
grant execute on function public.my_stream() to authenticated;

-- A student may withdraw their own open class-change request.
drop policy if exists "class requests delete own pending" on public.class_change_requests;
create policy "class requests delete own pending" on public.class_change_requests
  for delete to authenticated
  using (student_id = (select auth.uid()) and status = 'pending');

grant delete on public.class_change_requests to authenticated;

-- ---------------------------------------------------------------------------
-- Subjects (shared list; teachers add new ones while creating content)
-- ---------------------------------------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create unique index if not exists subjects_name_lower_idx on public.subjects (lower(name));

alter table public.subjects enable row level security;

drop policy if exists "subjects read" on public.subjects;
create policy "subjects read" on public.subjects
  for select to authenticated
  using ((select public.has_access()));

drop policy if exists "subjects staff write" on public.subjects;
create policy "subjects staff write" on public.subjects
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Courses and lessons
-- A NULL stream means "every stream" (and is always NULL below class 11).
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  class smallint not null check (class between 6 and 12),
  stream public.stream_type,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 500),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint courses_stream_only_senior check (stream is null or class >= 11)
);

create index if not exists courses_class_idx on public.courses (class, stream);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position integer not null default 0,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  type text not null check (type in ('video', 'pdf')),
  url text not null check (url ~ '^https://' and char_length(url) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists lessons_course_idx on public.lessons (course_id, position);

create table if not exists public.lesson_progress (
  student_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;

-- Students only see courses for their own class (and stream, for classes 11 and 12).
drop policy if exists "courses read" on public.courses;
create policy "courses read" on public.courses
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      (select public.has_access())
      and class = (select public.my_class())
      and (stream is null or stream = (select public.my_stream()))
    )
  );

drop policy if exists "courses staff write" on public.courses;
create policy "courses staff write" on public.courses
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- A lesson is visible exactly when its course is (the subquery applies the course policy).
drop policy if exists "lessons read" on public.lessons;
create policy "lessons read" on public.lessons
  for select to authenticated
  using (exists (select 1 from public.courses c where c.id = course_id));

drop policy if exists "lessons staff write" on public.lessons;
create policy "lessons staff write" on public.lessons
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop policy if exists "progress read own or staff" on public.lesson_progress;
create policy "progress read own or staff" on public.lesson_progress
  for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_staff()));

drop policy if exists "progress insert own" on public.lesson_progress;
create policy "progress insert own" on public.lesson_progress
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and exists (select 1 from public.lessons l where l.id = lesson_id)
  );

drop policy if exists "progress delete own" on public.lesson_progress;
create policy "progress delete own" on public.lesson_progress
  for delete to authenticated
  using (student_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Study material
-- ---------------------------------------------------------------------------
create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  class smallint not null check (class between 6 and 12),
  stream public.stream_type,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  url text not null check (url ~ '^https://' and char_length(url) <= 2000),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint materials_stream_only_senior check (stream is null or class >= 11)
);

create index if not exists materials_class_idx on public.study_materials (class, stream);

alter table public.study_materials enable row level security;

drop policy if exists "materials read" on public.study_materials;
create policy "materials read" on public.study_materials
  for select to authenticated
  using (
    (select public.is_staff())
    or (
      (select public.has_access())
      and class = (select public.my_class())
      and (stream is null or stream = (select public.my_stream()))
    )
  );

drop policy if exists "materials staff write" on public.study_materials;
create policy "materials staff write" on public.study_materials
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, delete on public.lesson_progress to authenticated;
grant select, insert, update, delete on public.study_materials to authenticated;

-- ---------------------------------------------------------------------------
-- Profile guard update: a student who is still waiting for approval may change
-- their own class directly. Once approved, class changes go through a request.
-- ---------------------------------------------------------------------------
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
         or new.class is null or new.age is null or new.mobile is null then
        raise exception 'Complete all profile fields first' using errcode = '23514';
      end if;
    end if;
    if (new.class is distinct from old.class or new.stream is distinct from old.stream)
       and old.status not in ('incomplete', 'pending') then
      raise exception 'Class changes need teacher approval' using errcode = '42501';
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
