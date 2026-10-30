-- Eureka Classes: community (messages, replies, likes) and AI usage tracking.
-- Run in the Supabase SQL Editor after 0008. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Messages. Replies are one level deep: a reply belongs to a top-level message.
-- ---------------------------------------------------------------------------
create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  parent_id uuid references public.community_messages (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists community_messages_feed_idx
  on public.community_messages (created_at desc) where parent_id is null;
create index if not exists community_messages_parent_idx
  on public.community_messages (parent_id, created_at);

create table if not exists public.community_likes (
  message_id uuid not null references public.community_messages (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

-- A reply must point at a top-level message, never at another reply.
create or replace function public.guard_community_message()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.parent_id is not null and exists (
    select 1 from public.community_messages
    where id = new.parent_id and parent_id is not null
  ) then
    raise exception 'Replies can only be made to top-level messages' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_community_message() from public, anon, authenticated;

drop trigger if exists community_messages_guard on public.community_messages;
create trigger community_messages_guard
  before insert on public.community_messages
  for each row execute function public.guard_community_message();

alter table public.community_messages enable row level security;
alter table public.community_likes enable row level security;

-- Approved students and staff only. A blocked or pending student sees and does nothing here.
drop policy if exists "community messages read" on public.community_messages;
create policy "community messages read" on public.community_messages
  for select to authenticated using ((select public.has_access()));

drop policy if exists "community messages insert" on public.community_messages;
create policy "community messages insert" on public.community_messages
  for insert to authenticated
  with check (author_id = (select auth.uid()) and (select public.has_access()));

-- Authors can remove their own messages; teachers can remove anyone's.
drop policy if exists "community messages delete" on public.community_messages;
create policy "community messages delete" on public.community_messages
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_staff()));

drop policy if exists "community likes read" on public.community_likes;
create policy "community likes read" on public.community_likes
  for select to authenticated using ((select public.has_access()));

drop policy if exists "community likes insert" on public.community_likes;
create policy "community likes insert" on public.community_likes
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.has_access()));

drop policy if exists "community likes delete" on public.community_likes;
create policy "community likes delete" on public.community_likes
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Reading the feed. Other people's profiles are private, so these functions return just
-- what the community needs: a display name, avatar, role and class, plus counts.
-- Students appear as first name and last initial; teachers by their full name.
-- ---------------------------------------------------------------------------
create or replace function public.community_feed(
  p_limit integer default 30,
  p_before timestamptz default null
)
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  author_id uuid,
  author_name text,
  author_avatar text,
  author_role public.user_role,
  author_class smallint,
  like_count bigint,
  liked_by_me boolean,
  reply_count bigint
)
language sql stable security definer set search_path = ''
as $$
  select
    m.id,
    m.body,
    m.created_at,
    m.author_id,
    case when p.role = 'student'
      then coalesce(nullif(split_part(btrim(p.full_name), ' ', 1), ''), 'Student')
           || coalesce(' ' || left(nullif(split_part(btrim(p.full_name), ' ', 2), ''), 1) || '.', '')
      else coalesce(nullif(btrim(p.full_name), ''), 'Teacher')
    end,
    p.avatar_url,
    p.role,
    p.class,
    (select count(*) from public.community_likes l where l.message_id = m.id),
    exists (select 1 from public.community_likes l where l.message_id = m.id and l.user_id = auth.uid()),
    (select count(*) from public.community_messages r where r.parent_id = m.id)
  from public.community_messages m
  join public.profiles p on p.id = m.author_id
  where m.parent_id is null
    and public.has_access()
    and (p_before is null or m.created_at < p_before)
  order by m.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

create or replace function public.community_replies(p_parent uuid)
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  author_id uuid,
  author_name text,
  author_avatar text,
  author_role public.user_role,
  author_class smallint,
  like_count bigint,
  liked_by_me boolean,
  reply_count bigint
)
language sql stable security definer set search_path = ''
as $$
  select
    m.id,
    m.body,
    m.created_at,
    m.author_id,
    case when p.role = 'student'
      then coalesce(nullif(split_part(btrim(p.full_name), ' ', 1), ''), 'Student')
           || coalesce(' ' || left(nullif(split_part(btrim(p.full_name), ' ', 2), ''), 1) || '.', '')
      else coalesce(nullif(btrim(p.full_name), ''), 'Teacher')
    end,
    p.avatar_url,
    p.role,
    p.class,
    (select count(*) from public.community_likes l where l.message_id = m.id),
    exists (select 1 from public.community_likes l where l.message_id = m.id and l.user_id = auth.uid()),
    0::bigint
  from public.community_messages m
  join public.profiles p on p.id = m.author_id
  where m.parent_id = p_parent and public.has_access()
  order by m.created_at asc
  limit 200;
$$;

revoke all on function public.community_feed(integer, timestamptz), public.community_replies(uuid)
  from public, anon;
grant execute on function public.community_feed(integer, timestamptz), public.community_replies(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- AI usage log: lets the server limit how often each person can use the AI helpers.
-- Only the server (service role) touches it, so there are deliberately no policies.
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (char_length(kind) <= 30),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_recent_idx on public.ai_usage (user_id, kind, created_at desc);

alter table public.ai_usage enable row level security;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
grant select, insert, delete on public.community_messages to authenticated;
grant select, insert, delete on public.community_likes to authenticated;
