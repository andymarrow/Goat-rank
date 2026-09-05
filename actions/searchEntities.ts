"use server";

import { createClient } from "@/utils/supabase/server";

export type EntityOption = {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  brand_color: string | null;
  lifetime_raised: number;
};

/**
 * Public contender search for the create flow.
 *
 * Creators previously had no way to see who already existed, so everyone
 * retyped names and the roster filled with duplicate Ronaldos. Approved
 * entities only — a pending paid submission must not surface publicly.
 */
export async function searchEntities(
  query: string,
  category?: string,
  limit = 18
): Promise<EntityOption[]> {
  const supabase = await createClient();

  let request = supabase
    .from("entities")
    .select("id, name, category, image_url, brand_color, lifetime_raised")
    .eq("moderation_status", "approved");

  const q = query?.trim();
  if (q) request = request.ilike("name", `%${q}%`);

  const { data, error } = await request
    .order("lifetime_raised", { ascending: false })
    .limit(60);

  if (error) {
    console.error("searchEntities failed:", error);
    return [];
  }

  const rows = (data ?? []) as EntityOption[];

  // Same-category first rather than filtering it away — picking a contender
  // from another category is unusual but legitimate.
  if (category) {
    const key = category.toLowerCase();
    rows.sort((a, b) => {
      const ac = a.category?.toLowerCase() === key ? 0 : 1;
      const bc = b.category?.toLowerCase() === key ? 0 : 1;
      return ac - bc || Number(b.lifetime_raised) - Number(a.lifetime_raised);
    });
  }

  return rows.slice(0, limit);
}
