-- ============================================================================
-- Voter identity + prepaid passes
--
-- ALREADY APPLIED to the hosted project via MCP on 2026-09-03. Mirrored here
-- so schema history stays in the repo. Idempotent.
-- ============================================================================

-- Votes were attributed to a random alias generated in the browser, so paid
-- battle cries carried a fake name and could not link back to an account.
alter table public.votes
  add column if not exists voter_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_votes_voter on public.votes (voter_id, created_at desc);

-- $10 buys 5 room deployments; $5 buys 5 contender injections. Creators were
-- charged the full $10 on every deploy, which is what the pass should prevent.
alter table public.profiles
  add column if not exists room_credits      integer not null default 0,
  add column if not exists contender_credits integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_room_credits_nonneg,
  drop constraint if exists profiles_contender_credits_nonneg;

alter table public.profiles
  add constraint profiles_room_credits_nonneg check (room_credits >= 0),
  add constraint profiles_contender_credits_nonneg check (contender_credits >= 0);

-- Conditional decrement in a single statement: two concurrent deploys can
-- never both spend the same last credit.
create or replace function public.consume_room_credit(uid uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare _ok boolean;
begin
  update public.profiles set room_credits = room_credits - 1
   where id = uid and room_credits > 0
  returning true into _ok;
  return coalesce(_ok, false);
end; $$;

create or replace function public.consume_contender_credit(uid uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare _ok boolean;
begin
  update public.profiles set contender_credits = contender_credits - 1
   where id = uid and contender_credits > 0
  returning true into _ok;
  return coalesce(_ok, false);
end; $$;

revoke all on function public.consume_room_credit(uuid) from public;
revoke all on function public.consume_contender_credit(uuid) from public;
