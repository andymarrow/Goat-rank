-- Everything the sharing, retention and free-play work needs.

-- ---------------------------------------------------------------- handles
-- A share card that can @mention the subject gets replies from their fans,
-- which is the difference between a post that dies and one that spreads.
alter table public.entities
  add column if not exists x_handle text,
  add column if not exists site_url text;


-- ------------------------------------------------------------- welcome mail
-- Stamped when the welcome email goes out, so confirming an address twice or
-- signing in on a second device does not send it again.
alter table public.profiles
  add column if not exists welcomed_at timestamptz;


-- ----------------------------------------------------------- notifications
-- In-app, with email as the second channel rather than the only one. An arena
-- that nobody is told about is an arena nobody comes back to.
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('overtaken', 'settled', 'backed', 'closing', 'system')),
  title      text not null,
  body       text,
  href       text,
  room_id    uuid references public.rooms(id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_inbox_idx
  on public.notifications (profile_id, read_at, created_at desc);

-- One "you were overtaken" per person per arena per hour, no matter how many
-- pledges land in that hour. The alternative is a notification per pledge,
-- which trains people to ignore the bell.
create index if not exists notifications_dedupe_idx
  on public.notifications (profile_id, room_id, kind, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "own notifications" on public.notifications;
create policy "own notifications"
  on public.notifications for select using (auth.uid() = profile_id);

drop policy if exists "mark own read" on public.notifications;
create policy "mark own read"
  on public.notifications for update using (auth.uid() = profile_id);


-- -------------------------------------------------------------- free picks
-- A visitor who will not pay yet still needs something to do. A pick is
-- opinion only: it never touches a pool, a standing or a payout, and the
-- interface says so. Kept in its own table for exactly that reason.
create table if not exists public.free_picks (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid not null references public.rooms(id) on delete cascade,
  contender_id     uuid not null references public.room_contenders(id) on delete cascade,
  user_fingerprint text not null,
  created_at       timestamptz not null default now()
);

-- One pick per arena per person, changeable by updating the row.
create unique index if not exists uniq_free_pick
  on public.free_picks (room_id, user_fingerprint);

create index if not exists free_picks_room_idx on public.free_picks (room_id);

alter table public.free_picks enable row level security;

drop policy if exists "picks are public" on public.free_picks;
create policy "picks are public"
  on public.free_picks for select using (true);


-- ----------------------------------------------------------------- settings
-- Single-row key/value so the console can change a number without a deploy.
create table if not exists public.app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('free_picks_per_user', '10')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "settings are public" on public.app_settings;
create policy "settings are public"
  on public.app_settings for select using (true);
