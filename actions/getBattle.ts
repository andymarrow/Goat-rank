"use server";

import { createClient } from "@/utils/supabase/server";
import { getRoomFeed } from "./getFeed";
import { getCharityPreference } from "./charityVote";

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
      charity_id,
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

  const [feedPage, charityPref] = await Promise.all([
    getRoomFeed(roomId),
    getCharityPreference(roomId),
  ]);

  const { data: charities } = await supabase
    .from("charities")
    .select("id, name, logo_url, website_url, payout_reference, description, is_active")
    .eq("is_active", true)
    .order("name");

  // 3. Format the data perfectly for our UI components
  // Sort contenders so index 0 is left, index 1 is right
  const sortedContenders = room.room_contenders.sort((a: any, b: any) => a.seed_index - b.seed_index);

  return {
    id: room.id,
    title: room.title,
    category: room.category,
    charity: room.charity_name,
    // The cause, with its logo and link, for the arena's charity card.
    //
    // The room's own charity is only the fallback: once backers start
    // nominating, the leading nomination is where the 30% is actually headed,
    // so that is the name the card has to carry. Falls back to a bare name for
    // rooms that predate the charity registry.
    beneficiary: pickBeneficiary(charities ?? [], charityPref.tally, room),
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
    // First page of battle cries; the sidebar pages the rest on demand.
    feed: feedPage.items,
    feedCursor: feedPage.nextCursor,
    feedHasMore: feedPage.hasMore,
    charities: charities ?? [],
    charityTally: charityPref.tally,
    charityChoice: charityPref.myChoice,
    charityTotal: charityPref.total,
  };
}

/**
 * Which cause an arena's charity card should name.
 *
 * Preference order: the charity leading the room's nomination vote, then the
 * charity the host linked, then whatever bare name the room carries. A room
 * with nominations shows the winner, which is the number people are voting to
 * move.
 */
function pickBeneficiary(
  charities: {
    id: string;
    name: string;
    logo_url: string | null;
    website_url: string | null;
    description: string | null;
  }[],
  tally: { charity_id: string; charity_name: string; logo_url: string | null; votes: number }[],
  room: { charity_id?: string | null; charity_name?: string | null }
) {
  const leader = [...(tally ?? [])]
    .filter((t) => Number(t.votes) > 0)
    .sort((a, b) => Number(b.votes) - Number(a.votes))[0];

  if (leader) {
    const full = charities.find((c) => c.id === leader.charity_id);

    return {
      id: leader.charity_id,
      name: leader.charity_name,
      logo_url: full?.logo_url ?? leader.logo_url,
      website_url: full?.website_url ?? null,
      description: full?.description ?? null,
      leading: true,
    };
  }

  const linked = charities.find((c) => c.id === room.charity_id);
  if (linked) return { ...linked, leading: false };

  if (room.charity_name && room.charity_name !== "Pending Charity" && room.charity_name !== "Demo Arena") {
    return {
      id: null,
      name: room.charity_name,
      logo_url: null,
      website_url: null,
      description: null,
      leading: false,
    };
  }

  return null;
}
