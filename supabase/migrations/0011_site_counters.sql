-- A visitor counter.
--
-- "59 online · 1,519,804 visitors" needs two different numbers: who is here
-- right now, which Realtime presence answers without storing anything, and how
-- many have ever arrived, which has to survive a page load.
--
-- One row per counter rather than a row per visit: the total is the only thing
-- ever read, and a visits table would grow forever to answer a question that
-- fits in a bigint.

create table if not exists public.site_counters (
  key        text primary key,
  value      bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.site_counters (key, value)
values ('visitors', 0)
on conflict (key) do nothing;

alter table public.site_counters enable row level security;

-- Readable by anyone: it is displayed on the homepage.
drop policy if exists "counters are public" on public.site_counters;
create policy "counters are public"
  on public.site_counters for select using (true);

-- Writes go only through the function below, never directly, so a client
-- cannot set the number to whatever it likes.
create or replace function public.bump_visitors()
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.site_counters (key, value, updated_at)
  values ('visitors', 1, now())
  on conflict (key) do update
    set value = public.site_counters.value + 1,
        updated_at = now()
  returning value;
$$;

revoke all on function public.bump_visitors() from public;
grant execute on function public.bump_visitors() to anon, authenticated;
