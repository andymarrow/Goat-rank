import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

type RawContender = {
  current_votes: number | string;
  seed_index: number;
  entities: { name: string; image_url: string | null; brand_color: string | null } | null;
};

export type PublicUserProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  /** Lifetime commission. Deliberately NOT wallet_balance, which is private. */
  totalEarned: number;
  isBanned: boolean;
  /** Seeded demo account — labelled on the profile page. */
  isBot: boolean;
  botPersona: string | null;
  createdAt: string;
  /** Participation — what a supporter does, as opposed to hosting. */
  totalPledged: number;
  arenasBacked: number;
  criesPosted: number;
  backed: {
    id: string;
    title: string;
    room_type: string;
    status: string;
    pledged: number;
  }[];
  arenasCreated: number;
  arenasSettled: number;
  poolRaised: number;
  arenas: {
    id: string;
    title: string;
    room_type: string;
    status: string;
    total_pool: number;
    /** Leading contender's art, so the listing is not a wall of text. */
    leader: { name: string; image_url: string | null; brand_color: string | null } | null;
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
    .select("id, username, avatar_url, total_earned, is_banned, created_at, is_bot, bot_persona")
    .eq("id", userId)
    .single();

  if (error || !profile) return null;

  // Service role only to read this one user's public room list; RLS on rooms
  // may not expose other people's pending rooms to an anonymous visitor.
  const { data: rooms } = await createAdminClient()
    .from("rooms")
    .select(
      `id, title, room_type, status, total_pool,
       room_contenders ( current_votes, seed_index, entities ( name, image_url, brand_color ) )`
    )
    .eq("creator_id", userId)
    .neq("status", "pending_payment")
    .order("created_at", { ascending: false })
    .limit(24);

  const list = rooms ?? [];

  // Bots host nothing — they back contenders. Without this the profile showed
  // four zeros for every seeded account and told the visitor nothing.
  const { data: myVotes } = await createAdminClient()
    .from("votes")
    .select("amount, message, room_id, rooms ( title, room_type, status )")
    .eq("voter_id", userId)
    .eq("refunded", false)
    .order("created_at", { ascending: false })
    .limit(200);

  const votes = myVotes ?? [];

  const byRoom = new Map<
    string,
    { id: string; title: string; room_type: string; status: string; pledged: number }
  >();

  for (const v of votes) {
    const room = v.rooms as unknown as
      | { title?: string; room_type?: string; status?: string }
      | null;
    if (!v.room_id) continue;

    const existing = byRoom.get(v.room_id);
    const amount = Number(v.amount) || 0;

    if (existing) existing.pledged += amount;
    else
      byRoom.set(v.room_id, {
        id: v.room_id,
        title: room?.title ?? "Arena",
        room_type: room?.room_type ?? "1v1",
        status: room?.status ?? "active",
        pledged: amount,
      });
  }

  const backed = [...byRoom.values()].sort((a, b) => b.pledged - a.pledged);

  return {
    id: profile.id,
    username: profile.username ?? "Operator",
    avatar_url: profile.avatar_url,
    totalEarned: Number(profile.total_earned) || 0,
    isBanned: Boolean(profile.is_banned),
    isBot: Boolean((profile as { is_bot?: boolean }).is_bot),
    botPersona: (profile as { bot_persona?: string }).bot_persona ?? null,
    createdAt: profile.created_at,
    totalPledged: votes.reduce((sum, v) => sum + (Number(v.amount) || 0), 0),
    arenasBacked: backed.length,
    criesPosted: votes.filter((v) => v.message?.trim()).length,
    backed: backed.slice(0, 24),
    arenasCreated: list.length,
    arenasSettled: list.filter((r) => r.status === "settled").length,
    poolRaised: list.reduce((sum, r) => sum + (Number(r.total_pool) || 0), 0),
    arenas: list.map((r) => {
      // Whoever is ahead fronts the card; falls back to seed order when the
      // arena has taken no votes yet.
      const contenders = ((r as unknown as { room_contenders?: RawContender[] }).room_contenders ?? [])
        .filter((rc) => rc.entities)
        .sort(
          (a, b) =>
            Number(b.current_votes) - Number(a.current_votes) || a.seed_index - b.seed_index
        );

      const top = contenders[0]?.entities ?? null;

      return {
        id: r.id,
        title: r.title,
        room_type: r.room_type,
        status: r.status,
        total_pool: Number(r.total_pool) || 0,
        leader: top
          ? { name: top.name, image_url: top.image_url, brand_color: top.brand_color }
          : null,
      };
    }),
  };
}
