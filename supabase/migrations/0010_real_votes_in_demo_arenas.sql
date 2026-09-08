-- Real money is allowed into a seeded arena.
--
-- 0009 forbade mixing in both directions: a demo vote could not attach to a
-- live arena, and a real vote could not attach to a demo one. The first half is
-- still right — seeded pledges must never inflate a real contest. The second
-- half turned out to be backwards for how the platform is actually used.
--
-- Seeded arenas exist precisely to be shared and backed: they are on the
-- homepage, they take the ordinary checkout, and the launch catalogue is what
-- gets posted. So a real backer paying into one is the intended outcome, not a
-- contamination — and blocking it meant Lemon Squeezy delivered a paid order
-- that the webhook could not record, returning 500 while the customer's money
-- had already moved.
--
-- Reporting stays honest because it keys off votes.is_demo, not rooms.is_demo:
-- a real vote in a seeded arena counts as revenue and charity liability, a
-- seeded one never does.

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

  return NEW;
end;
$$;

drop trigger if exists on_vote_demo_guard on public.votes;
create trigger on_vote_demo_guard
  before insert on public.votes
  for each row execute function public.guard_demo_vote();
