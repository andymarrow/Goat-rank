import { createClient } from "@/utils/supabase/server";

export type RosterEntity = {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  brand_color: string | null;
  lifetime_raised: number;
};

/**
 * Public contender directory, ranked by lifetime raised.
 *
 * Only approved entities are listed, so a pending $5 injection cannot appear
 * on the public roster before an admin has looked at its image.
 */
export async function getRoster(limit = 60, category?: string): Promise<RosterEntity[]> {
  const supabase = await createClient();

  let query = supabase
    .from("entities")
    .select("id, name, category, image_url, brand_color, lifetime_raised")
    .eq("moderation_status", "approved");

  if (category && category !== "all") query = query.ilike("category", category);

  const { data, error } = await query
    .order("lifetime_raised", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRoster failed:", error);
    return [];
  }

  return (data ?? []) as RosterEntity[];
}
