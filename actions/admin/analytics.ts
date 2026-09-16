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

/** One arena, measured by the real money in it. */
export type ArenaPerformance = {
  id: string;
  title: string;
  roomType: string;
  status: string;
  isDemo: boolean;
  createdAt: string;
  expiresAt: string;
  /** Real pledges only: what the pool would be without seeded content. */
  realRevenue: number;
  realVotes: number;
  backers: number;
  /** What the pool reads on the page, seeded pledges included. */
  displayedPool: number;
  /** Settled, or past its deadline. Decided here so the view stays pure. */
  closed: boolean;
};

/** One contender, measured the same way. */
export type ContenderPerformance = {
  id: string;
  name: string;
  imageUrl: string | null;
  realRevenue: number;
  realVotes: number;
  arenas: number;
};

export type AdminOverview = {
  treasury: Treasury;
  pulse: Pulse;
  volumeSeries: VolumePoint[];
  topArenas: ArenaPerformance[];
  newestArenas: ArenaPerformance[];
  topContenders: ContenderPerformance[];
  /** Arenas that have taken real money but no longer accept it. */
  closedWithRevenue: number;
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
 * Every query here excludes demo content. Seeded pledges fill a demo arena's
 * pool so the page looks alive, but counting them as revenue, charity
 * liability or user numbers would mean reporting money that does not exist.
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
      // Every real pledge, with enough of its row to attribute it to an arena
      // and a contender. Demo pledges are excluded everywhere in this file:
      // they fill a seeded arena's pool so the site looks alive, and counting
      // them as revenue would be reporting money nobody paid.
      supabase
        .from("votes")
        .select("amount, room_id, contender_id, voter_id")
        .eq("is_demo", false)
        .eq("refunded", false),
      supabase
        .from("votes")
        .select("amount, created_at")
        .eq("is_demo", false)
        .gte("created_at", since),
      // Demo arenas are included here, unlike the pledges: a seeded arena that
      // has taken real money is a real arena for reporting purposes, and
      // hiding it would hide that revenue's source.
      supabase
        .from("rooms")
        .select(
          `id, title, status, room_type, is_demo, total_pool, created_at, expires_at,
           room_contenders ( entity_id, entities ( id, name, image_url ) )`
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("profiles").select("wallet_balance, total_earned").eq("is_bot", false),
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

  const roomRows = (rooms.data ?? []) as unknown as {
    id: string;
    title: string;
    status: string;
    room_type: string;
    is_demo: boolean;
    total_pool: number;
    created_at: string;
    expires_at: string;
    room_contenders: {
      entity_id: string;
      entities: { id: string; name: string; image_url: string | null } | null;
    }[];
  }[];

  // Only arenas the house actually runs count toward the arena tallies; a
  // seeded one is scenery until somebody pays into it.
  const roomStatuses = roomRows.filter((r) => !r.is_demo);

  // ---------------------------------------------------------------- per arena
  const byRoom = new Map<string, { revenue: number; votes: number; backers: Set<string> }>();
  const byContender = new Map<string, { revenue: number; votes: number }>();

  for (const vote of voteRows.data ?? []) {
    const amount = Number(vote.amount) || 0;

    const room = byRoom.get(vote.room_id) ?? { revenue: 0, votes: 0, backers: new Set<string>() };
    room.revenue += amount;
    room.votes += 1;
    // An anonymous backer has no id, so each of those counts once.
    room.backers.add(vote.voter_id ?? `anon-${room.votes}`);
    byRoom.set(vote.room_id, room);

    if (vote.contender_id) {
      const c = byContender.get(vote.contender_id) ?? { revenue: 0, votes: 0 };
      c.revenue += amount;
      c.votes += 1;
      byContender.set(vote.contender_id, c);
    }
  }

  const performance: ArenaPerformance[] = roomRows.map((r) => {
    const stats = byRoom.get(r.id);

    return {
      id: r.id,
      title: r.title,
      roomType: r.room_type,
      status: r.status,
      isDemo: Boolean(r.is_demo),
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      realRevenue: stats?.revenue ?? 0,
      realVotes: stats?.votes ?? 0,
      backers: stats?.backers.size ?? 0,
      displayedPool: Number(r.total_pool) || 0,
      closed: r.status === "settled" || new Date(r.expires_at).getTime() <= Date.now(),
    };
  });

  // ------------------------------------------------------------ per contender
  // contender_id is a room_contenders row, so it has to be resolved back to
  // the entity: the same contender in three arenas is one name to rank.
  const entityOf = new Map<string, { id: string; name: string; imageUrl: string | null }>();
  const arenaCount = new Map<string, number>();

  for (const room of roomRows) {
    for (const link of room.room_contenders ?? []) {
      if (!link.entities) continue;
      entityOf.set(link.entity_id, {
        id: link.entities.id,
        name: link.entities.name,
        imageUrl: link.entities.image_url,
      });
      arenaCount.set(link.entities.id, (arenaCount.get(link.entities.id) ?? 0) + 1);
    }
  }

  // Map the vote's room_contenders id to its entity via the same rows.
  const linkToEntity = new Map<string, string>();
  for (const room of roomRows) {
    for (const link of room.room_contenders ?? []) {
      if (link.entities) linkToEntity.set(link.entity_id, link.entities.id);
    }
  }

  const contenderTotals = new Map<string, { revenue: number; votes: number }>();
  for (const [linkId, stats] of byContender) {
    const entityId = linkToEntity.get(linkId) ?? linkId;
    const current = contenderTotals.get(entityId) ?? { revenue: 0, votes: 0 };
    current.revenue += stats.revenue;
    current.votes += stats.votes;
    contenderTotals.set(entityId, current);
  }

  const topContenders: ContenderPerformance[] = [...contenderTotals.entries()]
    .map(([entityId, stats]) => {
      const meta = [...entityOf.values()].find((e) => e.id === entityId);

      return {
        id: entityId,
        name: meta?.name ?? "Contender",
        imageUrl: meta?.imageUrl ?? null,
        realRevenue: stats.revenue,
        realVotes: stats.votes,
        arenas: arenaCount.get(entityId) ?? 0,
      };
    })
    .filter((c) => c.realRevenue > 0)
    .sort((a, b) => b.realRevenue - a.realRevenue)
    .slice(0, 8);
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

    topArenas: [...performance]
      .filter((a) => a.realRevenue > 0)
      .sort((a, b) => b.realRevenue - a.realRevenue)
      .slice(0, 8),

    newestArenas: performance.slice(0, 6),

    topContenders,

    closedWithRevenue: performance.filter((a) => a.realRevenue > 0 && a.closed).length,
  };
}

/**
 * Counts for the sidebar badges.
 *
 * head:true count-only queries — the nav needs two numbers, not two full
 * datasets, and this runs on every admin page load.
 */
export async function getAdminBadges(): Promise<{ roster: number; ledger: number }> {
  await requireAdmin();
  const supabase = createAdminClient();

  const [entities, payouts] = await Promise.all([
    supabase
      .from("entities")
      .select("id", { count: "exact", head: true })
      .eq("moderation_status", "pending"),
    supabase
      .from("payout_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["requested", "approved"]),
  ]);

  return { roster: entities.count ?? 0, ledger: payouts.count ?? 0 };
}
