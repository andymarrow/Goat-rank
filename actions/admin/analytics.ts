import "server-only";

import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/utils/supabase/admin-auth";

/**
 * The platform split. The creator's 10% is the only slice the database
 * actually moves (handle_new_vote credits profiles.wallet_balance); the other
 * two are derived here for reporting.
 */
export const SPLIT = { platform: 0.6, charity: 0.3, creator: 0.1 } as const;

export type Treasury = {
  grossVolume: number;
  platformCut: number;
  charityLocked: number;
  creatorLocked: number;
  creatorWalletOutstanding: number;
  creatorPaidOut: number;
};

export type Pulse = {
  activeArenas: number;
  pendingArenas: number;
  settledArenas: number;
  totalUsers: number;
  totalVotes: number;
  votesToday: number;
  volumeToday: number;
  pendingEntities: number;
  pendingPayouts: number;
};

export type VolumePoint = { day: string; amount: number };

export type AdminOverview = {
  treasury: Treasury;
  pulse: Pulse;
  volumeSeries: VolumePoint[];
};

function startOfUtcDay(offsetDays = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d;
}

/**
 * One overview payload for the God-Eye panel.
 *
 * Supabase's PostgREST has no SUM aggregate over a filtered set without an RPC,
 * so amounts are summed in JS. That is fine at this scale and keeps the whole
 * console working off the base tables — revisit with an RPC if `votes` grows
 * past a few hundred thousand rows.
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  await requireAdmin();
  const supabase = createAdminClient();

  const since = startOfUtcDay(13).toISOString();
  const todayStart = startOfUtcDay().toISOString();

  const [voteRows, recentVotes, rooms, profiles, entitiesPending, payoutsPending] =
    await Promise.all([
      supabase.from("votes").select("amount"),
      supabase.from("votes").select("amount, created_at").gte("created_at", since),
      supabase.from("rooms").select("status"),
      supabase.from("profiles").select("wallet_balance, total_earned"),
      supabase
        .from("entities")
        .select("id", { count: "exact", head: true })
        .eq("moderation_status", "pending"),
      supabase
        .from("payout_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["requested", "approved"]),
    ]);

  const amounts = (voteRows.data ?? []).map((v) => Number(v.amount) || 0);
  const grossVolume = amounts.reduce((sum, n) => sum + n, 0);

  const walletOutstanding = (profiles.data ?? []).reduce(
    (sum, p) => sum + (Number(p.wallet_balance) || 0),
    0
  );
  const totalEarned = (profiles.data ?? []).reduce(
    (sum, p) => sum + (Number(p.total_earned) || 0),
    0
  );

  const roomStatuses = rooms.data ?? [];
  const todayRows = (recentVotes.data ?? []).filter((v) => v.created_at >= todayStart);

  // Bucket the last 14 days by UTC date for the sparkline.
  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    buckets.set(startOfUtcDay(i).toISOString().slice(0, 10), 0);
  }
  for (const row of recentVotes.data ?? []) {
    const key = String(row.created_at).slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + (Number(row.amount) || 0));
    }
  }

  return {
    treasury: {
      grossVolume,
      platformCut: grossVolume * SPLIT.platform,
      charityLocked: grossVolume * SPLIT.charity,
      creatorLocked: grossVolume * SPLIT.creator,
      creatorWalletOutstanding: walletOutstanding,
      creatorPaidOut: Math.max(totalEarned - walletOutstanding, 0),
    },
    pulse: {
      activeArenas: roomStatuses.filter((r) => r.status === "active").length,
      pendingArenas: roomStatuses.filter((r) => r.status === "pending_payment").length,
      settledArenas: roomStatuses.filter((r) => r.status === "settled").length,
      totalUsers: profiles.data?.length ?? 0,
      totalVotes: amounts.length,
      votesToday: todayRows.length,
      volumeToday: todayRows.reduce((sum, v) => sum + (Number(v.amount) || 0), 0),
      pendingEntities: entitiesPending.count ?? 0,
      pendingPayouts: payoutsPending.count ?? 0,
    },
    volumeSeries: [...buckets.entries()].map(([day, amount]) => ({ day, amount })),
  };
}
