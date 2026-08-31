import { createClient } from "@/utils/supabase/server";

export async function getActive1v1Rooms() {
  const supabase = await createClient();

  // We perform a powerful joined query:
  // Get active 1v1 rooms, and join their contenders, and join the entities for those contenders!
  const { data, error } = await supabase
    .from("rooms")
    .select(`
      id,
      title,
      total_pool,
      expires_at,
      room_contenders (
        current_votes,
        seed_index,
        entities (
          name,
          image_url,
          brand_color
        )
      )
    `)
    .eq("status", "active")
    .eq("room_type", "1v1")
    .order("total_pool", { ascending: false });

  if (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }

  return data;
}