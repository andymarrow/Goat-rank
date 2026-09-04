"use server";

import { createClient } from "@/utils/supabase/server";
import { bannerFor } from "@/lib/banners";
import { getRoomFeed } from "./getFeed";

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
  // First page only — FeedList pulls the rest with a keyset cursor.
  const feedPage = await getRoomFeed(roomId);

  return {
    id: room.id,
    title: room.title,
    category: room.category,
    charity: room.charity_name,
    totalPool: room.total_pool,
    expiresAt: room.expires_at,
    // Rooms have no cover column. Lead with the current leader's portrait —
    // it is the most meaningful image the room has — and fall back to a
    // category banner when the top contender has no art yet.
    image: rankedContenders[0]?.img ?? bannerFor(room.category, room.id),
    leader: rankedContenders[0]
      ? {
          name: rankedContenders[0].name,
          img: rankedContenders[0].img,
          color: rankedContenders[0].color,
          amount: rankedContenders[0].amount,
          entityId: rankedContenders[0].id,
        }
      : null,
    rankings: rankedContenders,
    feed: feedPage.items,
    feedCursor: feedPage.nextCursor,
    feedHasMore: feedPage.hasMore,
  };
}