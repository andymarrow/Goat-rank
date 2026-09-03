-- ============================================================================
-- PURGE DEMO / SEED DATA
--
-- DESTRUCTIVE. Run the SELECT in step 1 first and read the output before
-- running anything else.
--
-- Safety rail: every delete below is scoped to `total_pool = 0` and to rooms
-- with no votes attached. Nothing that has ever taken real money can be
-- removed by this script — settle those in /admin instead.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 1 — PREVIEW. Run this alone. Nothing is deleted.
-- ----------------------------------------------------------------------------
select
  r.id,
  r.title,
  r.room_type,
  r.status,
  r.total_pool,
  r.created_at,
  (select count(*) from public.votes v where v.room_id = r.id) as vote_count
from public.rooms r
where r.total_pool = 0
  and not exists (select 1 from public.votes v where v.room_id = r.id)
order by r.created_at;


-- ----------------------------------------------------------------------------
-- STEP 2 — DELETE the empty rooms listed above.
--
-- Uncomment to run. room_contenders goes first: it references both rooms and
-- entities, so deleting rooms while those rows exist trips the foreign key.
-- ----------------------------------------------------------------------------
-- with doomed as (
--   select r.id
--   from public.rooms r
--   where r.total_pool = 0
--     and not exists (select 1 from public.votes v where v.room_id = r.id)
-- )
-- delete from public.room_contenders where room_id in (select id from doomed);
--
-- with doomed as (
--   select r.id
--   from public.rooms r
--   where r.total_pool = 0
--     and not exists (select 1 from public.votes v where v.room_id = r.id)
-- )
-- delete from public.rooms where id in (select id from doomed);


-- ----------------------------------------------------------------------------
-- STEP 3 — DELETE orphaned entities.
--
-- Only entities that never raised anything and are not seeded into any
-- surviving room. Preview first, then uncomment the delete.
-- ----------------------------------------------------------------------------
-- select id, name, category, lifetime_raised
-- from public.entities e
-- where e.lifetime_raised = 0
--   and not exists (select 1 from public.room_contenders rc where rc.entity_id = e.id);

-- delete from public.entities e
-- where e.lifetime_raised = 0
--   and not exists (select 1 from public.room_contenders rc where rc.entity_id = e.id);


-- ----------------------------------------------------------------------------
-- STEP 4 — verify the site is now showing only real contests.
-- ----------------------------------------------------------------------------
-- select status, room_type, count(*) from public.rooms group by status, room_type;
