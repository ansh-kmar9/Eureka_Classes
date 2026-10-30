-- Eureka Classes: lets the server hand a deleted teacher's scheduled tests to the admin.
-- Run in the Supabase SQL Editor after 0010. Safe to re-run.
--
-- The guard on scheduled tests refuses every change to a cancelled test. That is right for people
-- using the app, but when the admin permanently deletes a teacher the server must move that
-- teacher's tests (including cancelled ones) to a new owner first. Calls with no signed-in user
-- (the server's service role, or the SQL editor) are trusted and skip the guard, exactly as the
-- profile guard already does.

create or replace function public.guard_scheduled_test_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

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

revoke all on function public.guard_scheduled_test_change() from public, anon, authenticated;
