"use server";

import { createClient } from "@/utils/supabase/server";

export async function getGlobalRoomData(roomId: string) {
  const supabase = await createClient();

  const { data: room, error } = await supabase
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

  if (error || !room) {
    console.error("Error fetching global room:", error);
    return null;
  }

  // Sort contenders by highest votes to establish the rank!
  const rankedContenders = room.room_contenders
    .sort((a: any, b: any) => b.current_votes - a.current_votes)
    .map((c: any, index: number) => ({
      id: c.entities.id, // We use entity ID so we can link to their profile
      contender_id: c.id, // We need this for the Vote button checkout
      rank: index + 1,
      name: c.entities.name,
      img: c.entities.image_url,
      color: c.entities.brand_color,
      amount: c.current_votes,
      trend: "same", // (Advanced feature for later: compare to yesterday's rank)
    }));

  // Battle cries. Global arenas collected these through the shared VoteModal
  // but never fetched or rendered them — every paid message was invisible.
  const { data: votes } = await supabase
    .from("votes")
    .select("id, amount, voter_name, voter_avatar, message, upvote_count, created_at, contender_id")
    .eq("room_id", roomId)
    .eq("message_hidden", false)
    .eq("refunded", false)
    .not("message", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const contenderNames = new Map(
    room.room_contenders.map((c: any) => [c.id, c.entities?.name ?? null])
  );

  return {
    id: room.id,
    title: room.title,
    category: room.category,
    charity: room.charity_name,
    totalPool: room.total_pool,
    expiresAt: room.expires_at,
    // We don't have a specific room image in DB schema yet, so we generate a consistent gradient based on the ID
    image: `https://images.unsplash.com/photo-1518605368461-1ee7e1634b6e?w=1600&q=80`, 
    rankings: rankedContenders,
    feed: (votes ?? []).map((v: any) => ({
      id: v.id,
      amount: Number(v.amount) || 0,
      voter_name: v.voter_name,
      voter_avatar: v.voter_avatar,
      message: v.message,
      upvote_count: v.upvote_count ?? 0,
      created_at: v.created_at,
      backing: contenderNames.get(v.contender_id) ?? null,
    })),
  };
}