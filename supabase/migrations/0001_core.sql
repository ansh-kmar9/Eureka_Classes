-- Eureka Classes: core schema (profiles, approvals, announcements, contact).
-- Run once in the Supabase SQL Editor. Safe to re-run: objects are created idempotently.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('student', 'teacher', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.student_status as enum ('incomplete', 'pending', 'approved', 'blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.stream_type as enum ('science', 'commerce', 'arts');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  avatar_url text,
  full_name text,
  class smallint check (class between 6 and 12),
  stream public.stream_type,
  age smallint check (age between 5 and 100),
  mobile text check (mobile ~ '^[0-9]{10}$'),
  role public.user_role not null default 'student',
  status public.student_status not null default 'incomplete',
  language text check (language in ('en', 'hi')),
  theme text check (theme in ('light', 'dark', 'system')),
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Stream is required for classes 11 and 12, and only for those.
  constraint profiles_stream_matches_class check (
    class is null
    or (class >= 11 and stream is not null)
    or (class < 11 and stream is null)
  )
);

create index if not exists profiles_class_status_idx on public.profiles (class, status);
create index if not exists profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so policies on profiles can use them
-- without recursing into profiles' own RLS.
-- ---------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('teacher', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Staff, or a student whose enrolment a teacher has approved.
create or replace function public.has_access()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role in ('teacher', 'admin') or status = 'approved')
  );
$$;

create or replace function public.my_class()
returns smallint language sql stable security definer set search_path = ''
as $$
  select class from public.profiles where id = auth.uid();
$$;

revoke all on function public.is_staff(), public.is_admin(), public.has_access(), public.my_class() from public, anon;
grant execute on function public.is_staff(), public.is_admin(), public.has_access(), public.my_class() to authenticated;

-- ---------------------------------------------------------------------------
-- Create a profile whenever someone signs in for the first time.
-- The admin account is recognised here, by its Google email, and nowhere a user can edit.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  is_admin_email boolean := lower(new.email) = 'anshkmr991@gmail.com';
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    (case when is_admin_email then 'admin' else 'student' end)::public.user_role,
    (case when is_admin_email then 'approved' else 'incomplete' end)::public.student_status
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for anyone who signed in before this migration ran.
insert into public.profiles (id, email, full_name, avatar_url, role, status)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.raw_user_meta_data ->> 'avatar_url',
  (case when lower(u.email) = 'anshkmr991@gmail.com' then 'admin' else 'student' end)::public.user_role,
  (case when lower(u.email) = 'anshkmr991@gmail.com' then 'approved' else 'incomplete' end)::public.student_status
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Guard: decides which columns each kind of user may change.
-- RLS controls WHICH rows; this controls WHAT may change in them.
-- Calls with no signed-in user (service role, SQL editor) are trusted.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_is_staff boolean;
begin
  if actor is null then
    new.updated_at := now();
    return new;
  end if;

  -- Immutable for everyone.
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
    -- A teacher editing someone else's profile.
    if old.role <> 'student' and not public.is_admin() then
      raise exception 'Only the admin can edit staff accounts' using errcode = '42501';
    end if;
    if new.status = 'approved' and old.status = 'incomplete' and new.role = 'student' then
      raise exception 'The student has not completed their profile' using errcode = '23514';
    end if;
  elsif not actor_is_staff then
    -- A student editing their own profile.
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
       and old.status <> 'incomplete' then
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
$$;

revoke all on function public.guard_profile_update() from public, anon, authenticated;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Row access. Students see only themselves. Staff see everyone.
alter table public.profiles enable row level security;

drop policy if exists "profiles read own or staff" on public.profiles;
create policy "profiles read own or staff" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));

drop policy if exists "profiles update own or staff" on public.profiles;
create policy "profiles update own or staff" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()))
  with check (id = (select auth.uid()) or (select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Class change requests
-- ---------------------------------------------------------------------------
create table if not exists public.class_change_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  from_class smallint,
  to_class smallint not null check (to_class between 6 and 12),
  to_stream public.stream_type,
  status public.request_status not null default 'pending',
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint class_change_stream_matches_class check (
    (to_class >= 11 and to_stream is not null) or (to_class < 11 and to_stream is null)
  )
);

-- One open request per student.
create unique index if not exists class_change_one_pending_idx
  on public.class_change_requests (student_id) where status = 'pending';

alter table public.class_change_requests enable row level security;

drop policy if exists "class requests read own or staff" on public.class_change_requests;
create policy "class requests read own or staff" on public.class_change_requests
  for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_staff()));

drop policy if exists "class requests insert own" on public.class_change_requests;
create policy "class requests insert own" on public.class_change_requests
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and status = 'pending'
    and (select public.has_access())
  );

-- Staff decide through this function, never by editing rows directly.
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
    set class = req.to_class, stream = req.to_stream
    where id = req.student_id;
  end if;

  update public.class_change_requests
  set status = (case when approve then 'approved' else 'rejected' end)::public.request_status,
      decided_by = auth.uid(),
      decided_at = now()
  where id = request_id;
end;
$$;

revoke all on function public.decide_class_change(uuid, boolean) from public, anon;
grant execute on function public.decide_class_change(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Push subscriptions (written by the user, read by the server with the service role)
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push own all" on public.push_subscriptions;
create policy "push own all" on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Announcements
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists announcements_created_idx on public.announcements (created_at desc);

alter table public.announcements enable row level security;

drop policy if exists "announcements read approved" on public.announcements;
create policy "announcements read approved" on public.announcements
  for select to authenticated
  using ((select public.has_access()));

drop policy if exists "announcements staff write" on public.announcements;
create policy "announcements staff write" on public.announcements
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Contact form (public insert, admin read)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  email text not null check (char_length(email) between 3 and 200),
  phone text check (phone is null or char_length(phone) <= 20),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "contact insert anyone" on public.contact_messages;
create policy "contact insert anyone" on public.contact_messages
  for insert to anon, authenticated
  with check (true);

drop policy if exists "contact admin read" on public.contact_messages;
create policy "contact admin read" on public.contact_messages
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "contact admin update" on public.contact_messages;
create policy "contact admin update" on public.contact_messages
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "contact admin delete" on public.contact_messages;
create policy "contact admin delete" on public.contact_messages
  for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Table privileges (RLS above decides rows; these decide the verbs at all)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert on public.class_change_requests to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
grant insert on public.contact_messages to anon;
grant select, insert, update, delete on public.contact_messages to authenticated;
