"use server";

import { createClient } from "@/utils/supabase/server";
import { FEED_PAGE_SIZE, type FeedPage } from "@/lib/feed";
import { getMyUpvotes } from "./upvote";
import { CURSOR_SEP } from "@/lib/feed";

/**
 * One page of paid battle cries for a room, most-backed first.
 *
 * The cries people upvoted rise to the top; ties fall back to newest. Ordering
 * by time alone buried the best line in an arena the moment a few more pledges
 * landed.
 *
 * Keyset pagination rather than range/offset: a busy arena gets new votes
 * between requests, and an offset would silently skip or repeat rows as
 * everything shifts down. The cursor is composite — "<upvotes>|<created_at>" —
 * because the sort is now two columns deep. Upvote counts do change under a
 * reader, so a row can shift pages mid-scroll; the caller de-duplicates by id.
 */
export async function getRoomFeed(
  roomId: string,
  before?: string | null
): Promise<FeedPage> {
  const supabase = await createClient();

  let query = supabase
    .from("votes")
    .select(
      `id, amount, voter_name, voter_avatar, voter_id, message,
       upvote_count, created_at, contender_id, is_demo`
    )
    .eq("room_id", roomId)
    .eq("message_hidden", false)
    .eq("refunded", false)
    .not("message", "is", null)
    .order("upvote_count", { ascending: false })
    .order("created_at", { ascending: false })
    // Fetch one extra to detect whether another page exists, without a count.
    .limit(FEED_PAGE_SIZE + 1);

  if (before) {
    const [rawUpvotes, ...rest] = before.split(CURSOR_SEP);
    const upvotes = Number(rawUpvotes);
    const timestamp = rest.join(CURSOR_SEP);

    if (Number.isFinite(upvotes) && timestamp) {
      // "Everything ranked below this row": fewer upvotes, or the same number
      // and older. The timestamp is quoted because PostgREST reads an
      // unquoted dot as the operator separator.
      query = query.or(
        `upvote_count.lt.${upvotes},and(upvote_count.eq.${upvotes},created_at.lt."${timestamp}")`
      );
    } else {
      // A cursor minted before the ranking change: a bare timestamp.
      query = query.lt("created_at", before);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("getRoomFeed failed:", error);
    return { items: [], nextCursor: null, hasMore: false };
  }

  const rows = data ?? [];
  const hasMore = rows.length > FEED_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows;

  // Resolve contender names in one query rather than per row.
  const contenderIds = [...new Set(page.map((r) => r.contender_id).filter(Boolean))];
  const names = new Map<string, string>();

  if (contenderIds.length > 0) {
    const { data: contenders } = await supabase
      .from("room_contenders")
      .select("id, entities ( name )")
      .in("id", contenderIds as string[]);

    for (const c of contenders ?? []) {
      const name = (c.entities as unknown as { name?: string } | null)?.name;
      if (name) names.set(c.id, name);
    }
  }

  // One query for the whole page, so the button renders in the right state
  // instead of always looking un-upvoted until you click it.
  const mine = new Set(await getMyUpvotes(page.map((r) => r.id)));

  return {
    items: page.map((r) => ({
      id: r.id,
      amount: Number(r.amount) || 0,
      voter_name: r.voter_name,
      voter_avatar: r.voter_avatar,
      voter_id: r.voter_id ?? null,
      message: r.message,
      upvote_count: r.upvote_count ?? 0,
      created_at: r.created_at,
      backing: r.contender_id ? names.get(r.contender_id) ?? null : null,
      upvoted: mine.has(r.id),
      is_demo: Boolean((r as { is_demo?: boolean }).is_demo),
    })),
    nextCursor:
      page.length > 0
        ? `${page[page.length - 1].upvote_count ?? 0}${CURSOR_SEP}${page[page.length - 1].created_at}`
        : null,
    hasMore,
  };
}
