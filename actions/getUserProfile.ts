import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export type PublicUserProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  /** Lifetime commission. Deliberately NOT wallet_balance, which is private. */
  totalEarned: number;
  isBanned: boolean;
  createdAt: string;
  arenasCreated: number;
  arenasSettled: number;
  poolRaised: number;
  arenas: {
    id: string;
    title: string;
    room_type: string;
    status: string;
    total_pool: number;
  }[];
};

/**
 * Public creator profile.
 *
 * Exposes only what a visitor should see: display name, avatar, lifetime
 * earnings and the arenas they ran. wallet_balance (withdrawable now) and
 * anything auth-related are never selected.
 */
export async function getUserProfile(userId: string): Promise<PublicUserProfile | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, total_earned, is_banned, created_at")
    .eq("id", userId)
    .single();

  if (error || !profile) return null;

  // Service role only to read this one user's public room list; RLS on rooms
  // may not expose other people's pending rooms to an anonymous visitor.
  const { data: rooms } = await createAdminClient()
    .from("rooms")
    .select("id, title, room_type, status, total_pool")
    .eq("creator_id", userId)
    .neq("status", "pending_payment")
    .order("created_at", { ascending: false })
    .limit(24);

  const list = rooms ?? [];

  return {
    id: profile.id,
    username: profile.username ?? "Operator",
    avatar_url: profile.avatar_url,
    totalEarned: Number(profile.total_earned) || 0,
    isBanned: Boolean(profile.is_banned),
    createdAt: profile.created_at,
    arenasCreated: list.length,
    arenasSettled: list.filter((r) => r.status === "settled").length,
    poolRaised: list.reduce((sum, r) => sum + (Number(r.total_pool) || 0), 0),
    arenas: list.map((r) => ({
      id: r.id,
      title: r.title,
      room_type: r.room_type,
      status: r.status,
      total_pool: Number(r.total_pool) || 0,
    })),
  };
}
