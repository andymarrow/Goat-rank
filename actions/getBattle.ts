"use server";

import { createClient } from "@/utils/supabase/server";

export async function getBattleData(roomId: string) {
  const supabase = await createClient();

  // 1. Fetch the Room, Contenders, and Entities
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select(`
      id,
      title,
      category,
      charity_name,
      total_pool,
      expires_at,
      room_contenders (
        id,
        current_votes,
        seed_index,
        entities (
          id,
          name,
          image_url,
          brand_color
        )
      )
    `)
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    console.error("Error fetching room:", roomError);
    return null;
  }

  // 2. Fetch the latest 50 votes for the Chat Feed
  const { data: votes, error: votesError } = await supabase
    .from("votes")
    .select(`
      id,
      voter_name,
      voter_avatar,
      amount,
      message,
      upvote_count,
      created_at,
      contender_id
    `)
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (votesError) {
    console.error("Error fetching votes:", votesError);
  }

  // 3. Format the data perfectly for our UI components
  // Sort contenders so index 0 is left, index 1 is right
  const sortedContenders = room.room_contenders.sort((a: any, b: any) => a.seed_index - b.seed_index);

  return {
    id: room.id,
    title: room.title,
    category: room.category,
    charity: room.charity_name,
    totalPool: room.total_pool,
    // Raw timestamp; the client formats and ticks it via useCountdown.
    expiresAt: room.expires_at,
    contenders: sortedContenders.map((c: any) => ({
      id: c.id, // The room_contender ID
      entityId: c.entities.id,
      name: c.entities.name,
      image: c.entities.image_url,
      color: c.entities.brand_color,
      amount: c.current_votes,
    })),
    recentVotes: votes || [],
  };
}