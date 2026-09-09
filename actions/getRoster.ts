import { createClient } from "@/utils/supabase/server";

export type RosterEntity = {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  brand_color: string | null;
  lifetime_raised: number;
  /** Arenas this contender is in right now. */
  liveArenas: number;
  /** Every arena it has ever been in, live or settled. */
  totalArenas: number;
};

/**
 * Public contender directory, ranked by lifetime raised.
 *
 * Only contenders that are actually in a contest are listed. The roster used
 * to read straight from `entities`, which meant it also showed anything left
 * behind by an abandoned create flow or a deleted arena: names with no contest
 * anywhere on the site, which is exactly what a visitor cannot make sense of.
 *
 * Live arenas sort first, then lifetime raised, so the top of the roster is
 * somewhere you can actually go and back someone.
 *
 * Approved entities only, so a pending $5 injection cannot appear here before
 * an admin has looked at its image.
 */
export async function getRoster(limit = 60, category?: string): Promise<RosterEntity[]> {
  const supabase = await createClient();

  // Which entities are in a room, and how many of those rooms are live.
  const { data: links, error: linkError } = await supabase
    .from("room_contenders")
    .select("entity_id, rooms!inner ( status )")
    .limit(2000);

  if (linkError) {
    console.error("getRoster links failed:", linkError);
    return [];
  }

  const live = new Map<string, number>();
  const total = new Map<string, number>();

  for (const link of links ?? []) {
    const status = (link.rooms as unknown as { status?: string } | null)?.status;
    const id = link.entity_id as string;

    total.set(id, (total.get(id) ?? 0) + 1);
    if (status === "active") live.set(id, (live.get(id) ?? 0) + 1);
  }

  const ids = [...total.keys()];
  if (ids.length === 0) return [];

  let query = supabase
    .from("entities")
    .select("id, name, category, image_url, brand_color, lifetime_raised")
    .eq("moderation_status", "approved")
    .in("id", ids);

  if (category && category !== "all") query = query.ilike("category", category);

  const { data, error } = await query
    .order("lifetime_raised", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRoster failed:", error);
    return [];
  }

  return (data ?? [])
    .map((e) => ({
      ...e,
      lifetime_raised: Number(e.lifetime_raised) || 0,
      liveArenas: live.get(e.id) ?? 0,
      totalArenas: total.get(e.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        Number(b.liveArenas > 0) - Number(a.liveArenas > 0) ||
        b.lifetime_raised - a.lifetime_raised
    );
}
