"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { getFingerprint } from "@/lib/fingerprint";

const UNIQUE_VIOLATION = "23505";

export type UpvoteResult = {
  success: boolean;
  upvoted?: boolean;
  count?: number;
  error?: string;
};

/**
 * Toggle the caller's upvote on a testimonial.
 *
 * The unique index on (vote_id, user_fingerprint) is the real guarantee — a
 * read-then-insert check loses to two concurrent clicks, so a 23505 collision
 * is treated as "already upvoted" rather than an error.
 */
export async function toggleTestimonialUpvote(voteId: string): Promise<UpvoteResult> {
  if (!voteId) return { success: false, error: "Missing vote id." };

  try {
    const fingerprint = await getFingerprint(true);
    if (!fingerprint) return { success: false, error: "Could not identify you." };

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("testimonial_upvotes")
      .select("id")
      .eq("vote_id", voteId)
      .eq("user_fingerprint", fingerprint)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("testimonial_upvotes")
        .delete()
        .eq("id", existing.id);

      if (error) throw error;
      return { success: true, upvoted: false };
    }

    const { error } = await supabase.from("testimonial_upvotes").insert({
      vote_id: voteId,
      user_fingerprint: fingerprint,
    });

    if (error) {
      // Raced with another click from the same person — already counted.
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        return { success: true, upvoted: true };
      }
      throw error;
    }

    return { success: true, upvoted: true };
  } catch (error) {
    console.error("toggleTestimonialUpvote failed:", error);
    return { success: false, error: "Could not register that upvote." };
  }
}

/** Which of these testimonials the caller has already upvoted. */
export async function getMyUpvotes(voteIds: string[]): Promise<string[]> {
  if (voteIds.length === 0) return [];

  try {
    const fingerprint = await getFingerprint(false);
    if (!fingerprint) return [];

    const { data } = await createAdminClient()
      .from("testimonial_upvotes")
      .select("vote_id")
      .eq("user_fingerprint", fingerprint)
      .in("vote_id", voteIds);

    return (data ?? []).map((r) => r.vote_id);
  } catch (error) {
    console.error("getMyUpvotes failed:", error);
    return [];
  }
}
