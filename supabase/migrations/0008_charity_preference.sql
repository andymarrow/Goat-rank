-- ============================================================================
-- Charity preference vote
--
-- NOT YET APPLIED — the Supabase MCP connection is down. Run in the SQL
-- editor. Idempotent.
--
-- When an arena settles and the winner does not claim a cause, the charity
-- share still has to go somewhere. This lets the room's participants say where.
-- ============================================================================

create table if not exists public.room_charity_votes (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms(id) on delete cascade,
  charity_id  uuid not null references public.charities(id) on delete cascade,
  voter_id    uuid references public.profiles(id) on delete set null,
  fingerprint text not null,
  created_at  timestamptz not null default timezone('utc', now())
);

-- One preference per person per room. Changing your mind updates the row
-- rather than stacking another vote.
create unique index if not exists uniq_room_charity_voter
  on public.room_charity_votes (room_id, fingerprint);

create index if not exists idx_room_charity_tally
  on public.room_charity_votes (room_id, charity_id);

alter table public.room_charity_votes enable row level security;

-- Tallies are public; the arena shows them to everyone.
drop policy if exists "charity preferences are public" on public.room_charity_votes;
create policy "charity preferences are public" on public.room_charity_votes
  for select using (true);

-- Records which cause actually received an arena's charity share.
alter table public.rooms
  add column if not exists settled_charity_id uuid references public.charities(id);

-- Tally view, so the UI does not group in JavaScript.
create or replace view public.room_charity_tally as
  select
    v.room_id,
    v.charity_id,
    c.name  as charity_name,
    c.logo_url,
    count(*) as votes
  from public.room_charity_votes v
  join public.charities c on c.id = v.charity_id
  group by v.room_id, v.charity_id, c.name, c.logo_url;
