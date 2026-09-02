import { createClient } from "@/utils/supabase/server";
import { ROOM_SORTS, type RoomSort } from "@/lib/constants";

const SELECT = `
  id,
  title,
  category,
  total_pool,
  expires_at,
  created_at,
  room_contenders (
    current_votes,
    seed_index,
    entities (
      name,
      image_url,
      brand_color
    )
  )
`;

/**
 * Active 1v1 arenas for the homepage rail.
 *
 * `sort` and `category` come from the URL so a filtered view is shareable and
 * server-rendered rather than hidden in client state.
 */
export async function getActive1v1Rooms(
  sort: RoomSort = "hot",
  category?: string
) {
  const supabase = await createClient();
  const { column, ascending } = ROOM_SORTS[sort] ?? ROOM_SORTS.hot;

  let query = supabase
    .from("rooms")
    .select(SELECT)
    .eq("status", "active")
    .eq("room_type", "1v1");

  if (category && category !== "all") {
    query = query.ilike("category", category);
  }

  // "Ending soon" should not surface arenas that have already expired.
  if (sort === "closing") {
    query = query.gte("expires_at", new Date().toISOString());
  }

  const { data, error } = await query.order(column, { ascending }).limit(40);

  if (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }

  return data;
}

/** Distinct categories that actually have a live arena behind them. */
export async function getLiveCategories(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rooms")
    .select("category")
    .eq("status", "active");

  if (error || !data) return [];

  return [...new Set(data.map((r) => r.category).filter(Boolean))].sort();
}
