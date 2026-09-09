-- Feature requests and charity nominations from the public.
--
-- Two kinds in one table rather than two tables: they are the same object —
-- someone asks for something, other people back it, an admin moves it along —
-- and splitting them would duplicate the upvote machinery for no gain.
--
-- Upvotes are deduped by the same anonymous fingerprint the testimonial
-- upvotes use, so a signed-out visitor can still back a request once without
-- an account, and cannot back it fifty times.

create table if not exists public.requests (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('feature', 'charity')),
  title         text not null check (char_length(title) between 3 and 120),
  detail        text check (char_length(detail) <= 1000),
  link          text check (char_length(link) <= 300),
  status        text not null default 'open'
                check (status in ('open', 'planned', 'shipped', 'declined')),
  admin_note    text check (char_length(admin_note) <= 500),
  upvote_count  integer not null default 0,
  submitted_by  uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists requests_rank_idx
  on public.requests (status, upvote_count desc, created_at desc);

create table if not exists public.request_upvotes (
  id               uuid primary key default gen_random_uuid(),
  request_id       uuid not null references public.requests(id) on delete cascade,
  user_fingerprint text not null,
  created_at       timestamptz not null default now()
);

create unique index if not exists uniq_request_upvote
  on public.request_upvotes (request_id, user_fingerprint);

-- Keep the counter honest in both directions, the way the testimonial
-- counters already do. Application code must never touch upvote_count.
create or replace function public.handle_request_upvote()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.requests
  set upvote_count = upvote_count + 1
  where id = NEW.request_id;
  return NEW;
end;
$$;

create or replace function public.handle_request_upvote_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.requests
  set upvote_count = greatest(upvote_count - 1, 0)
  where id = OLD.request_id;
  return OLD;
end;
$$;

drop trigger if exists on_request_upvote on public.request_upvotes;
create trigger on_request_upvote
  after insert on public.request_upvotes
  for each row execute function public.handle_request_upvote();

drop trigger if exists on_request_upvote_removed on public.request_upvotes;
create trigger on_request_upvote_removed
  after delete on public.request_upvotes
  for each row execute function public.handle_request_upvote_removed();

alter table public.requests enable row level security;
alter table public.request_upvotes enable row level security;

-- The board is public; everything else goes through server actions holding
-- the service key, so there is no client-side insert policy to abuse.
drop policy if exists "requests are public" on public.requests;
create policy "requests are public"
  on public.requests for select using (true);

drop policy if exists "request upvotes are public" on public.request_upvotes;
create policy "request upvotes are public"
  on public.request_upvotes for select using (true);
