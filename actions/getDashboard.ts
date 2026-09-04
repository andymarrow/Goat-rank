import "server-only";

import { createClient } from "@/utils/supabase/server";
import { generatedAvatar } from "@/lib/avatar";
import { createAdminClient } from "@/utils/supabase/admin";

type RawContender = {
  seed_index: number;
  entities: { name: string; image_url: string | null; brand_color: string | null } | null;
};

export type DashboardBattle = {
  id: string;
  title: string;
  status: string;
  room_type: string;
  total_pool: number;
  my_cut: number;
  expires_at: string;
  /** Contender art, so the listing reads as arenas rather than table rows. */
  contenders: { name: string; image_url: string | null; brand_color: string | null }[];
};

export type DashboardLedgerRow = {
  id: string;
  type: "commission" | "payout";
  amount: number;
  label: string;
  created_at: string;
  /** Present on commission rows so the ledger can link to the arena. */
  room_id?: string;
  room_type?: string;
};

export type DashboardData = {
  name: string;
  avatar: string;
  walletBalance: number;
  totalEarned: number;
  activeBattles: number;
  isBanned: boolean;
  battles: DashboardBattle[];
  ledger: DashboardLedgerRow[];
  pendingPayout: number;
  roomCredits: number;
  contenderCredits: number;
};

/**
 * Everything the creator dashboard shows, for the signed-in user only.
 *
 * Identity comes from the cookie-backed client; the service-role client is
 * then used purely to read that one user's own rows, so this can never be
 * pointed at somebody else's wallet.
 */
export async function getDashboard(): Promise<DashboardData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  const [profileRes, roomsRes, votesRes, payoutsRes] = await Promise.all([
    admin
      .from("profiles")
      .select("username, avatar_url, wallet_balance, total_earned, is_banned, room_credits, contender_credits")
      .eq("id", user.id)
      .single(),
    admin
      .from("rooms")
      .select(
        `id, title, status, room_type, total_pool, expires_at,
         room_contenders ( seed_index, entities ( name, image_url, brand_color ) )`
      )
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false }),
    admin
      .from("votes")
      .select("id, amount, created_at, room_id, rooms!inner ( title, creator_id, room_type )")
      .eq("rooms.creator_id", user.id)
      .eq("refunded", false)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("payout_requests")
      .select("id, amount, status, requested_at, processed_at")
      .eq("profile_id", user.id)
      .order("requested_at", { ascending: false })
      .limit(50),
  ]);

  const profile = profileRes.data;
  const rooms = roomsRes.data ?? [];

  // The creator's 10% is credited per-vote by handle_new_vote, so a room's
  // commission is simply 10% of its pool.
  const battles: DashboardBattle[] = rooms.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    room_type: r.room_type,
    total_pool: Number(r.total_pool) || 0,
    my_cut: (Number(r.total_pool) || 0) * 0.1,
    expires_at: r.expires_at,
    contenders: ((r as unknown as { room_contenders?: RawContender[] }).room_contenders ?? [])
      .filter((rc) => rc.entities)
      .sort((a, b) => a.seed_index - b.seed_index)
      .slice(0, 4)
      .map((rc) => ({
        name: rc.entities!.name,
        image_url: rc.entities!.image_url,
        brand_color: rc.entities!.brand_color,
      })),
  }));

  const commissions: DashboardLedgerRow[] = (votesRes.data ?? []).map((v) => ({
    id: `vote-${v.id}`,
    type: "commission" as const,
    amount: (Number(v.amount) || 0) * 0.1,
    label: (v.rooms as unknown as { title?: string } | null)?.title ?? "Arena",
    created_at: v.created_at,
    room_id: v.room_id,
    room_type: (v.rooms as unknown as { room_type?: string } | null)?.room_type,
  }));

  const payoutRows = payoutsRes.data ?? [];

  const payouts: DashboardLedgerRow[] = payoutRows
    .filter((p) => p.status === "paid")
    .map((p) => ({
      id: `payout-${p.id}`,
      type: "payout" as const,
      amount: -(Number(p.amount) || 0),
      label: "Withdrawal",
      created_at: p.processed_at ?? p.requested_at,
    }));

  return {
    name: profile?.username ?? user.email?.split("@")[0] ?? "Operator",
    avatar:
      profile?.avatar_url ??
      generatedAvatar(user.id),
    walletBalance: Number(profile?.wallet_balance) || 0,
    totalEarned: Number(profile?.total_earned) || 0,
    activeBattles: rooms.filter((r) => r.status === "active").length,
    isBanned: Boolean(profile?.is_banned),
    battles,
    ledger: [...commissions, ...payouts]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 40),
    roomCredits: Number(profile?.room_credits) || 0,
    contenderCredits: Number(profile?.contender_credits) || 0,
    pendingPayout: payoutRows
      .filter((p) => p.status === "requested" || p.status === "approved")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
  };
}
