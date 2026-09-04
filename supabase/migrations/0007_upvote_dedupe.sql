-- ============================================================================
-- One upvote per person
--
-- NOT YET APPLIED — the Supabase MCP connection dropped. Run this in the SQL
-- editor. Idempotent.
--
-- addTestimonialUpvote generated a fresh random fingerprint on every click, so
-- the dedupe column existed but never deduped anything: one person could
-- inflate a testimonial without limit. Application code now derives a stable
-- fingerprint, and this constraint is what actually enforces it — app-level
-- checks alone lose to two concurrent clicks.
-- ============================================================================

-- Collapse any existing duplicates first, keeping the earliest row, or the
-- unique index below cannot be created.
delete from public.testimonial_upvotes a
using public.testimonial_upvotes b
where a.vote_id = b.vote_id
  and a.user_fingerprint = b.user_fingerprint
  and a.created_at > b.created_at;

create unique index if not exists uniq_testimonial_upvote
  on public.testimonial_upvotes (vote_id, user_fingerprint);

-- Recompute votes.upvote_count from the surviving rows, since the old
-- behaviour inflated it.
update public.votes v
set upvote_count = coalesce((
  select count(*) from public.testimonial_upvotes u where u.vote_id = v.id
), 0);

-- Keep the counter honest when an upvote is withdrawn.
create or replace function public.handle_upvote_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.votes
     set upvote_count = greatest(upvote_count - 1, 0)
   where id = OLD.vote_id;
  return OLD;
end;
$$;

drop trigger if exists on_upvote_removed on public.testimonial_upvotes;
create trigger on_upvote_removed
  after delete on public.testimonial_upvotes
  for each row execute function public.handle_upvote_removed();
