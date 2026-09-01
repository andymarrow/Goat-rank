"use server";

import { createClient } from "@/utils/supabase/server";

export async function addTestimonialUpvote(voteId: string) {
  const supabase = await createClient();

  // In a full production environment, we would generate a stable fingerprint 
  // based on the user's IP or Session ID to prevent them from voting twice.
  // For this MVP, we will generate a random string, meaning they can upvote multiple times,
  // but it proves the database connection works.
  const tempFingerprint = Math.random().toString(36).substring(7);

  const { error } = await supabase
    .from("testimonial_upvotes")
    .insert({
      vote_id: voteId,
      user_fingerprint: tempFingerprint,
    });

  if (error) {
    console.error("Error inserting upvote:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}