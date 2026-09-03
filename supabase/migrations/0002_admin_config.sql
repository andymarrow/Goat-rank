-- ============================================================================
-- GOAT RANK — Admin Console, part 2: global config, house studio, refunds
--
-- Run after 0001_admin_console.sql. Idempotent; safe to re-run.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Category manager
--
-- Categories are currently hardcoded in the UI (FILTERS in
-- GlobalLeaderboardsRow, the create flow, etc). This makes them data.
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  label      text not null,
  accent     text default '#FF7A00',
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.categories enable row level security;

drop policy if exists "categories are public" on public.categories;
create policy "categories are public" on public.categories
  for select using (is_active or public.is_admin());

insert into public.categories (slug, label, sort_order) values
  ('sports',    'Sports',    10),
  ('soccer',    'Soccer',    20),
  ('basketball','Basketball',30),
  ('movies',    'Movies',    40),
  ('tech',      'Tech',      50),
  ('cars',      'Cars',      60),
  ('racing',    'Racing',    70),
  ('countries', 'Countries', 80)
on conflict (slug) do nothing;


-- ----------------------------------------------------------------------------
-- 2. Charity registry
--
-- Room creators pick from this approved list instead of typing free text into
-- rooms.charity_name. payout_reference is where you actually send the money.
-- ----------------------------------------------------------------------------
create table if not exists public.charities (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique,
  logo_url          text,
  website_url       text,
  payout_reference  text,
  description       text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default timezone('utc', now())
);

alter table public.charities enable row level security;

drop policy if exists "charities are public" on public.charities;
create policy "charities are public" on public.charities
  for select using (is_active or public.is_admin());

-- Link rooms to the registry. charity_name stays as the display snapshot so
-- historical rooms keep the name they were settled under even if the registry
-- row is later renamed or deactivated.
alter table public.rooms
  add column if not exists charity_id uuid references public.charities(id);


-- ----------------------------------------------------------------------------
-- 3. Global megaphone (site-wide banner)
-- ----------------------------------------------------------------------------
create table if not exists public.site_banners (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  href       text,
  variant    text not null default 'info',
  is_active  boolean not null default false,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.site_banners enable row level security;

-- Anonymous visitors must be able to read the live banner.
drop policy if exists "active banner is public" on public.site_banners;
create policy "active banner is public" on public.site_banners
  for select using (
    public.is_admin()
    or (
      is_active
      and (starts_at is null or starts_at <= now())
      and (ends_at   is null or ends_at   >= now())
    )
  );

create index if not exists idx_site_banners_active
  on public.site_banners (created_at desc) where is_active;


-- ----------------------------------------------------------------------------
-- 4. Refund / chargeback tracking, for the Lemon Squeezy sync
-- ----------------------------------------------------------------------------
alter table public.votes
  add column if not exists refunded    boolean not null default false,
  add column if not exists refunded_at timestamptz;

create index if not exists idx_votes_refunded
  on public.votes (refunded_at desc) where refunded;

/*
 * Reverse the aggregates when a vote is refunded.
 *
 * handle_new_vote() only fires on INSERT, so without this a refunded vote
 * would keep inflating the battle pool, the entity's lifetime total and the
 * creator's wallet forever. This mirrors that function exactly, in reverse,
 * and fires only on the false -> true transition so it can never double-apply.
 */
create or replace function public.handle_vote_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _room_creator_id uuid;
  _commission      numeric;
  _entity_id       uuid;
begin
  update public.room_contenders
     set current_votes = greatest(current_votes - NEW.amount, 0)
   where id = NEW.contender_id
  returning entity_id into _entity_id;

  update public.rooms
     set total_pool = greatest(total_pool - NEW.amount, 0)
   where id = NEW.room_id
  returning creator_id into _room_creator_id;

  update public.entities
     set lifetime_raised = greatest(lifetime_raised - NEW.amount, 0)
   where id = _entity_id;

  if _room_creator_id is not null then
    _commission := NEW.amount * 0.10;

    update public.profiles
       set wallet_balance = greatest(wallet_balance - _commission, 0),
           total_earned   = greatest(total_earned   - _commission, 0)
     where id = _room_creator_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_vote_refunded on public.votes;
create trigger on_vote_refunded
  after update of refunded on public.votes
  for each row
  when (NEW.refunded is true and OLD.refunded is false)
  execute function public.handle_vote_refund();


-- ----------------------------------------------------------------------------
-- 5. Charity ledger, now excluding refunded votes
--
-- Dropped rather than replaced: CREATE OR REPLACE VIEW can only append columns
-- to the end of an existing view, and this version inserts payout_reference in
-- the middle. Nothing depends on the view, so dropping it is free.
-- ----------------------------------------------------------------------------
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
  left join public.votes v on v.room_id = r.id and v.refunded = false
  where r.status = 'settled'
  group by coalesce(c.name, r.charity_name), c.payout_reference;
