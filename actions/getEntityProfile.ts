"use server";

import { createClient } from "@/utils/supabase/server";
import { bannerFor } from "@/lib/banners";

export async function getEntityProfileData(entityId: string) {
  const supabase = await createClient();

  // 1. Fetch the Entity's core stats
  const { data: entity, error: entityError } = await supabase
    .from("entities")
    .select(`
      id,
      name,
      category,
      brand_color,
      image_url,
      lifetime_raised,
      total_battles
    `)
    .eq("id", entityId)
    .single();

  if (entityError || !entity) {
    console.error("Error fetching entity profile:", entityError);
    return null;
  }

  // 2. Fetch the Testimonials (Votes where this entity was backed)
  // We need to join through room_contenders to find votes that belong to this entity
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
      contender_id,
      room_contenders!inner(entity_id)
    `)
    .eq("room_contenders.entity_id", entityId)
    .order("amount", { ascending: false }) // Show the biggest "Whale" spenders at the top!
    .limit(20);

  if (votesError) {
    console.error("Error fetching entity testimonials:", votesError);
  }

  return {
    id: entity.id,
    name: entity.name,
    category: entity.category,
    color: entity.brand_color,
    totalRaised: entity.lifetime_raised,
    battles: entity.total_battles,
    image: entity.image_url,
    // Category-matched banner, stable per entity. Every profile previously
    // shared one hardcoded stadium photo.
    banner: bannerFor(entity.category, entity.id),
    rank: 1, // We will calculate true global rank later in the aggregation phase
    winRate: "TBD", // We will calculate true win rate later
    topCharity: "Multiple",
    testimonials: (votes || []).map((v: any) => ({
      id: v.id,
      user: v.voter_name,
      amount: v.amount,
      text: v.message,
      upvotes: v.upvote_count,
      date: new Date(v.created_at).toLocaleDateString(),
    }))
  };
}