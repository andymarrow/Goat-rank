"use server";

import { createClient } from "@/utils/supabase/server";
import { bannerFor } from "@/lib/banners";
import { getRoomFeed } from "./getFeed";
import { getCharityPreference } from "./charityVote";

export async function getGlobalRoomData(roomId: string) {
  const supabase = await createClient();

  const { data: room, error } = await supabase
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
  const [feedPage, charityPref] = await Promise.all([
    getRoomFeed(roomId),
    getCharityPreference(roomId),
  ]);

  const { data: charities } = await supabase
    .from("charities")
    .select("id, name, logo_url, website_url, payout_reference, description, is_active")
    .eq("is_active", true)
    .order("name");

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
