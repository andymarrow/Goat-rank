-- ============================================================================
-- GOAT RANK — Admin Console schema
--
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New
-- query). Every statement is idempotent, so re-running it is safe.
--
-- The last statement grants YOU admin. It is commented out — fill in your
-- email and run it, otherwise /admin will lock everyone out including you.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Admin + ban flags on profiles
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin      boolean not null default false,
  add column if not exists is_banned     boolean not null default false,
  add column if not exists banned_at     timestamptz,
  add column if not exists banned_reason text;


-- ----------------------------------------------------------------------------
-- 2. is_admin() helper
--
-- SECURITY DEFINER so RLS policies on other tables can ask "is this user an
-- admin?" without needing their own SELECT policy on profiles, and without
-- risking recursive policy evaluation.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;


-- ----------------------------------------------------------------------------
-- 3. Homepage feature/pin + settlement audit trail on rooms
-- ----------------------------------------------------------------------------
alter table public.rooms
  add column if not exists is_featured   boolean not null default false,
  add column if not exists featured_rank integer,
  add column if not exists settled_at    timestamptz,
  add column if not exists settled_by    uuid references public.profiles(id);


-- ----------------------------------------------------------------------------
-- 4. Message moderation on votes
--
-- Soft-hide only. The row keeps its amount so the pool, the creator's
-- commission and the charity accrual are all untouched when a message is
-- nuked — we are deleting words, never money.
-- ----------------------------------------------------------------------------
alter table public.votes
  add column if not exists message_hidden boolean not null default false,
  add column if not exists hidden_at      timestamptz,
  add column if not exists hidden_by      uuid references public.profiles(id);


-- ----------------------------------------------------------------------------
-- 5. Entity moderation queue (paid $5 contender injections)
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.entity_moderation_status as enum ('approved', 'pending', 'rejected');
exception when duplicate_object then null; end $$;

alter table public.entities
  add column if not exists moderation_status public.entity_moderation_status
    not null default 'approved',
  add column if not exists submitted_by uuid references public.profiles(id),
  add column if not exists submitted_at timestamptz;


-- ----------------------------------------------------------------------------
-- 6. Creator payout queue
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.payout_status as enum ('requested', 'approved', 'paid', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.payout_requests (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  amount           numeric not null check (amount > 0),
  status           public.payout_status not null default 'requested',
  requested_at     timestamptz not null default timezone('utc', now()),
  processed_at     timestamptz,
  processed_by     uuid references public.profiles(id),
  payout_reference text,
  notes            text
);

alter table public.payout_requests enable row level security;

drop policy if exists "read own payout requests" on public.payout_requests;
create policy "read own payout requests" on public.payout_requests
  for select using (auth.uid() = profile_id or public.is_admin());

drop policy if exists "request own payout" on public.payout_requests;
create policy "request own payout" on public.payout_requests
  for insert with check (auth.uid() = profile_id);

-- Writes from the admin console go through the service-role client, which
-- bypasses RLS entirely; no UPDATE policy is granted to end users on purpose.


-- ----------------------------------------------------------------------------
-- 7. Charity ledger
--
-- Charity owed was previously only a claim in the vote modal — nothing in the
-- database recorded it. This view derives it from settled rooms so the admin
-- export has a single source of truth.
-- ----------------------------------------------------------------------------
create or replace view public.charity_ledger as
  select
    r.charity_name,
    count(*)                              as room_count,
    sum(r.total_pool)                     as gross_pool,
    round(sum(r.total_pool) * 0.30, 2)    as charity_owed,
    min(r.settled_at)                     as first_settled_at,
    max(r.settled_at)                     as last_settled_at
  from public.rooms r
  where r.status = 'settled'
    and r.charity_name is not null
  group by r.charity_name;


-- ----------------------------------------------------------------------------
-- 8. Indexes for the console's hot queries
-- ----------------------------------------------------------------------------
create index if not exists idx_rooms_featured
  on public.rooms (featured_rank) where is_featured;
create index if not exists idx_rooms_status
  on public.rooms (status, created_at desc);
create index if not exists idx_votes_created
  on public.votes (created_at desc);
create index if not exists idx_votes_room_created
  on public.votes (room_id, created_at desc);
create index if not exists idx_payout_requests_status
  on public.payout_requests (status, requested_at desc);
create index if not exists idx_entities_moderation
  on public.entities (submitted_at desc) where moderation_status = 'pending';


-- ----------------------------------------------------------------------------
-- 9. GRANT YOURSELF ADMIN — required, or /admin locks everyone out.
--    Uncomment, set your email, run.
-- ----------------------------------------------------------------------------
-- update public.profiles set is_admin = true
-- where id = (select id from auth.users where email = 'you@example.com');
