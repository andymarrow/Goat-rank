-- GOAT points, levels and achievements.
--
-- Two balances, deliberately separate:
--
--   goat_points    spendable, goes down when someone buys a privilege
--   lifetime_points experience, only ever goes up
--
-- Level is derived from lifetime, so spending never costs someone their
-- standing. Tie the two together and nobody ever spends, which makes the store
-- decorative.

alter table public.profiles
  add column if not exists goat_points     integer not null default 0,
  add column if not exists lifetime_points integer not null default 0,
  add column if not exists goat_level      integer not null default 1,
  add column if not exists streak_days     integer not null default 0,
  add column if not exists longest_streak  integer not null default 0,
  add column if not exists streak_day      date,
  -- Free picks bought or granted, on top of the site-wide allowance.
  add column if not exists bonus_free_picks integer not null default 0;

create index if not exists profiles_leaderboard_idx
  on public.profiles (lifetime_points desc)
  where is_bot = false;


-- ------------------------------------------------------------------ ledger
-- Every point ever awarded, with the reason. Without this you cannot answer
-- "why do I have 340 points", cannot audit a bug, and cannot stop a webhook
-- retry paying twice.
create table if not exists public.point_events (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  kind        text not null,
  points      integer not null,
  reason      text,
  room_id     uuid references public.rooms(id) on delete set null,
  -- Stable per awardable event: "vote:<id>", "streak:<date>", "level:12".
  -- The unique index below is what makes awarding idempotent.
  dedupe_key  text,
  created_at  timestamptz not null default now()
);

create unique index if not exists uniq_point_event
  on public.point_events (profile_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists point_events_feed_idx
  on public.point_events (profile_id, created_at desc);


-- ------------------------------------------------------------ achievements
create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text not null,
  icon        text not null default 'award',
  tier        text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'legend')),
  points      integer not null default 25,
  -- What to measure, and how much of it. Read by the checker in app code so a
  -- new achievement is a row, not a deploy.
  metric      text not null check (metric in (
                'pledges', 'pledged_total', 'biggest_pledge', 'arenas_hosted',
                'winners_backed', 'upvotes_received', 'streak', 'picks', 'level'
              )),
  threshold   integer not null default 1,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.profile_achievements (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now()
);

create unique index if not exists uniq_profile_achievement
  on public.profile_achievements (profile_id, achievement_id);


-- -------------------------------------------------------------- level gifts
-- What reaching a level hands you. A table rather than a formula so the curve
-- can be tuned from the console without a deploy.
create table if not exists public.level_rewards (
  level              integer primary key,
  title              text not null,
  room_credits       integer not null default 0,
  contender_credits  integer not null default 0,
  free_picks         integer not null default 0,
  points             integer not null default 0
);

insert into public.level_rewards (level, title, room_credits, contender_credits, free_picks, points) values
  (2,   'Regular',      0, 0,  5,   25),
  (5,   'Backer',       1, 0, 10,   50),
  (10,  'Contender',    1, 1, 15,  100),
  (15,  'Operator',     2, 2, 20,  150),
  (25,  'Heavyweight',  3, 5, 40,  300),
  (40,  'Kingmaker',    5, 10, 60, 500),
  (50,  'Legend',      10, 25, 100, 1000),
  (75,  'Immortal',    15, 40, 150, 2000),
  (100, 'GOAT',        25, 75, 300, 5000)
on conflict (level) do nothing;


-- --------------------------------------------------------------- the store
create table if not exists public.reward_items (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text not null,
  icon        text not null default 'gift',
  cost        integer not null check (cost > 0),
  grant_kind  text not null check (grant_kind in ('room_credits', 'contender_credits', 'free_picks')),
  grant_amount integer not null check (grant_amount > 0),
  sort_order  integer not null default 0,
  is_active   boolean not null default true
);

insert into public.reward_items (slug, name, description, icon, cost, grant_kind, grant_amount, sort_order) values
  ('picks-10',      '10 free picks',    'Ten more arenas you can weigh in on without paying.', 'hand',   50,  'free_picks',        10, 10),
  ('rooms-2',       '2 arenas',         'Host two arenas without buying a creator pass.',      'swords', 150, 'room_credits',       2, 20),
  ('contenders-5',  '5 contender slots','Add five contenders to global arenas.',               'user-plus', 120, 'contender_credits', 5, 30),
  ('rooms-5',       '5 arenas',         'Host five arenas. The whole pass, earned.',           'crown',  340, 'room_credits',       5, 40)
on conflict (slug) do nothing;

create table if not exists public.reward_purchases (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item_id    uuid not null references public.reward_items(id) on delete restrict,
  cost       integer not null,
  created_at timestamptz not null default now()
);

create index if not exists reward_purchases_idx
  on public.reward_purchases (profile_id, created_at desc);


-- ----------------------------------------------------------------- reading
alter table public.point_events        enable row level security;
alter table public.achievements        enable row level security;
alter table public.profile_achievements enable row level security;
alter table public.level_rewards       enable row level security;
alter table public.reward_items        enable row level security;
alter table public.reward_purchases    enable row level security;

-- Definitions are public: the store and the achievement list are part of the
-- pitch, and someone should be able to see what is worth chasing before they
-- sign up.
drop policy if exists "achievements are public" on public.achievements;
create policy "achievements are public" on public.achievements for select using (true);

drop policy if exists "level rewards are public" on public.level_rewards;
create policy "level rewards are public" on public.level_rewards for select using (true);

drop policy if exists "reward items are public" on public.reward_items;
create policy "reward items are public" on public.reward_items for select using (true);

-- Unlocked achievements are public too: a badge nobody can see is not a badge.
drop policy if exists "unlocks are public" on public.profile_achievements;
create policy "unlocks are public" on public.profile_achievements for select using (true);

-- The ledger and purchases are yours alone.
drop policy if exists "own point events" on public.point_events;
create policy "own point events" on public.point_events for select using (auth.uid() = profile_id);

drop policy if exists "own purchases" on public.reward_purchases;
create policy "own purchases" on public.reward_purchases for select using (auth.uid() = profile_id);


-- ------------------------------------------------------- spending, safely
-- Deducting in app code loses a race: two tabs both read 200, both spend 150.
-- One statement with the balance in its WHERE clause cannot.
create or replace function public.spend_goat_points(uid uuid, amount integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  spent integer;
begin
  update public.profiles
  set goat_points = goat_points - amount
  where id = uid and goat_points >= amount
  returning goat_points into spent;

  return spent is not null;
end;
$$;

revoke all on function public.spend_goat_points(uuid, integer) from public;
grant execute on function public.spend_goat_points(uuid, integer) to authenticated;


-- Awarding is additive and must never be lost to a concurrent update either.
create or replace function public.award_goat_points(uid uuid, amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
begin
  update public.profiles
  set goat_points     = goat_points + amount,
      lifetime_points = lifetime_points + greatest(amount, 0)
  where id = uid
  returning lifetime_points into total;

  return coalesce(total, 0);
end;
$$;

revoke all on function public.award_goat_points(uuid, integer) from public;


-- ------------------------------------------------------------ seed badges
insert into public.achievements (slug, name, description, icon, tier, points, metric, threshold, sort_order) values
  ('first-blood',  'First Blood',   'Backed a contender with real money.',              'zap',        'bronze',  50, 'pledges',          1, 10),
  ('regular',      'Regular',       'Backed five different pledges.',                   'repeat',     'bronze',  75, 'pledges',          5, 20),
  ('patron',       'Patron',        'Twenty-five pledges deep.',                        'gem',        'silver', 200, 'pledges',         25, 30),
  ('high-roller',  'High Roller',   'Put $50 behind one contender in a single pledge.', 'flame',      'silver', 150, 'biggest_pledge',  50, 40),
  ('whale',        'Whale',         'A single pledge of $250.',                         'anchor',     'gold',   500, 'biggest_pledge', 250, 50),
  ('invested',     'Invested',      'Pledged $100 across the platform.',                'wallet',     'silver', 150, 'pledged_total',  100, 60),
  ('benefactor',   'Benefactor',    'Pledged $1,000 all told.',                         'heart-handshake', 'gold', 750, 'pledged_total', 1000, 70),
  ('host',         'Host',          'Started an argument of your own.',                 'swords',     'bronze', 100, 'arenas_hosted',    1, 80),
  ('promoter',     'Promoter',      'Hosted five arenas.',                              'megaphone',  'silver', 250, 'arenas_hosted',    5, 90),
  ('oracle',       'Oracle',        'Backed the winning side five times.',              'sparkles',   'silver', 200, 'winners_backed',   5, 100),
  ('kingmaker',    'Kingmaker',     'Backed twenty-five winners.',                      'crown',      'gold',   600, 'winners_backed',  25, 110),
  ('quotable',     'Quotable',      'Your battle cries earned ten upvotes.',            'message-square', 'bronze', 75, 'upvotes_received', 10, 120),
  ('loudmouth',    'Loudmouth',     'A hundred upvotes on your cries.',                 'mic',        'gold',   400, 'upvotes_received', 100, 130),
  ('committed',    'Committed',     'Five days in a row.',                              'calendar',   'bronze', 100, 'streak',           5, 140),
  ('devoted',      'Devoted',       'Thirty days in a row.',                            'calendar-check', 'gold', 600, 'streak',         30, 150),
  ('opinionated',  'Opinionated',   'Made twenty free picks.',                          'hand',       'bronze',  50, 'picks',           20, 160),
  ('ascendant',    'Ascendant',     'Reached level 10.',                                'trending-up','silver', 200, 'level',           10, 170),
  ('the-goat',     'The GOAT',      'Reached level 50.',                                'award',      'legend', 2000, 'level',          50, 180)
on conflict (slug) do nothing;


-- --------------------------------------------------------------- point rates
insert into public.app_settings (key, value) values
  ('points_per_dollar',    '5'),
  ('points_daily_visit',   '10'),
  ('points_streak_step',   '5'),
  ('points_streak_cap',    '60'),
  ('points_upvote',        '2'),
  ('points_free_pick',     '2'),
  ('points_winner_bonus',  '50'),
  ('points_host_pledge',   '10'),
  ('level_curve_base',     '60'),
  ('level_curve_exponent', '1.5')
on conflict (key) do nothing;
