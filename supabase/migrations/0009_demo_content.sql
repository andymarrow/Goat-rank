-- ============================================================================
-- Demo arenas and bot accounts
--
-- NOT YET APPLIED — the Supabase MCP connection is down. Run in the SQL
-- editor. Idempotent.
--
-- A new platform looks abandoned. Rather than hardcoding fixtures in
-- lib/mockData.ts (which the admin console can never edit), demo content is
-- ordinary rows carrying an is_demo flag. Detail pages, moderation and CRUD
-- then work through the code that already exists.
--
-- Everything demo is DISCLOSED in the UI with a marker, and excluded from
-- financial reporting — see the analytics note at the bottom.
-- ============================================================================

alter table public.profiles
  add column if not exists is_bot boolean not null default false,
  add column if not exists bot_persona text;

alter table public.rooms
  add column if not exists is_demo boolean not null default false;

alter table public.entities
  add column if not exists is_demo boolean not null default false;

alter table public.votes
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_rooms_demo on public.rooms (is_demo) where is_demo;
create index if not exists idx_votes_demo on public.votes (is_demo) where is_demo;
create index if not exists idx_profiles_bot on public.profiles (is_bot) where is_bot;

/*
 * Demo votes must not move real money.
 *
 * handle_new_vote() credits room_contenders, rooms.total_pool,
 * entities.lifetime_raised AND the creator's wallet. A demo vote legitimately
 * fills a demo room's pool, but it must never touch a real entity's lifetime
 * total or pay a real creator — that would be inventing revenue.
 *
 * Demo rooms are created with creator_id null, so no commission is paid. This
 * trigger additionally blocks a demo vote from being attached to a room that
 * is not itself flagged demo.
 */
create or replace function public.guard_demo_vote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _room_is_demo boolean;
begin
  select is_demo into _room_is_demo from public.rooms where id = NEW.room_id;

  if NEW.is_demo and not coalesce(_room_is_demo, false) then
    raise exception 'A demo vote cannot be attached to a live arena (room %)', NEW.room_id;
  end if;

  if not NEW.is_demo and coalesce(_room_is_demo, false) then
    raise exception 'A real vote cannot be attached to a demo arena (room %)', NEW.room_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_vote_demo_guard on public.votes;
create trigger on_vote_demo_guard
  before insert on public.votes
  for each row execute function public.guard_demo_vote();

-- Bots are profiles without auth users, so the FK to auth.users must not
-- apply to them. Drop it if present and keep the primary key only.
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'profiles' and constraint_name = 'profiles_id_fkey'
  ) then
    alter table public.profiles drop constraint profiles_id_fkey;
  end if;
end $$;

/*
 * Reporting view: real money only.
 *
 * The God-Eye treasury sums every vote. Without this, seeded demo pledges
 * would show up as platform revenue and charity liability — numbers you might
 * act on. Analytics reads this instead of the raw table.
 */
create or replace view public.real_votes as
  select * from public.votes where is_demo = false;


-- The charity ledger bills real money only. A demo arena's pool is seeded, so
-- including it would tell you to send a charity money nobody paid.
drop view if exists public.charity_ledger;

create view public.charity_ledger as
  select
    coalesce(c.name, r.charity_name)   as charity_name,
    c.payout_reference,
    count(distinct r.id)               as room_count,
    coalesce(sum(v.amount), 0)         as gross_pool,
    round(coalesce(sum(v.amount), 0) * 0.30, 2) as charity_owed,
    min(r.settled_at)                  as first_settled_at,
    max(r.settled_at)                  as last_settled_at
  from public.rooms r
  left join public.charities c on c.id = r.charity_id
  left join public.votes v
    on v.room_id = r.id and v.refunded = false and v.is_demo = false
  where r.status = 'settled'
    and r.is_demo = false
  group by coalesce(c.name, r.charity_name), c.payout_reference;
