"use server";

import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

export type Pledge = {
  id: string;
  /** The Stripe payment id, which is this pledge's public share slug. */
  paymentId: string;
  amount: number;
  message: string | null;
  voterName: string;
  voterAvatar: string | null;
  voterId: string | null;
  createdAt: string;
  contender: {
    name: string;
    image: string | null;
    color: string | null;
    entityId: string | null;
    xHandle: string | null;
  };
  arena: {
    id: string;
    title: string;
    category: string;
    roomType: string;
    totalPool: number;
    expiresAt: string;
  };
  /** Where this pledge put the contender, and by how much. */
  standing: { rank: number; of: number; share: number; leading: boolean };
  charityName: string | null;
};

/** The shape the two selects below return, whether or not x_handle exists. */
type VoteRow = {
  id: string;
  amount: number | string;
  message: string | null;
  voter_name: string;
  voter_avatar: string | null;
  voter_id: string | null;
  created_at: string;
  contender_id: string;
  room_id: string;
  rooms: {
    id: string;
    title: string;
    category: string;
    room_type: string;
    total_pool: number | string;
    expires_at: string;
    charity_name: string | null;
  } | null;
  room_contenders: {
    id: string;
    entities: {
      id: string;
      name: string;
      image_url: string | null;
      brand_color: string | null;
      x_handle?: string | null;
    } | null;
  } | null;
};

/** Anon, cookie-free: a share page is public and has no viewer. */
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Resolve a Stripe Checkout session to the pledge it created.
 *
 * Stripe hands the browser back a session id; the vote row is keyed by the
 * payment intent, which only the API knows. Looking it up here means the share
 * page works from the redirect alone, with no id passed through the client and
 * nothing to forge: a session that is not paid, or not ours, resolves to
 * nothing.
 *
 * Returns null while the webhook has not landed yet, which the page treats as
 * "confirming" rather than "failed" — the money is taken, the row is seconds
 * away.
 */
export async function getPledgeBySession(sessionId: string): Promise<Pledge | null> {
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") return null;

    const paymentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? session.id;

    return await getPledgeByPaymentId(paymentId);
  } catch (error) {
    console.error("getPledgeBySession failed:", error);
    return null;
  }
}

/** The same lookup from the id stored on the vote, for the share page itself. */
export async function getPledgeByPaymentId(paymentId: string): Promise<Pledge | null> {
  try {
    const supabase = publicClient();

    const base =
      "id, amount, message, voter_name, voter_avatar, voter_id, created_at, contender_id, room_id," +
      " rooms ( id, title, category, room_type, total_pool, expires_at, charity_name )," +
      " room_contenders ( id, entities ( id, name, image_url, brand_color";

    const run = (select: string) =>
      supabase
        .from("votes")
        .select(select)
        .eq("polar_transaction_id", paymentId)
        .eq("refunded", false)
        .maybeSingle();

    let { data, error } = await run(`${base}, x_handle ) )`);

    // 42703 is "column does not exist": the handle arrives with migration
    // 0013, and a share card without a mention is still a share card. Better
    // that than the page 404ing on a deploy that lands before the migration.
    if (error?.code === "42703") {
      ({ data, error } = await run(`${base} ) )`));
    }

    if (error) console.error("getPledgeByPaymentId query failed:", error.message);
    if (!data) return null;

    const vote = data as unknown as VoteRow;

    const room = vote.rooms;
    const entity = vote.room_contenders?.entities;

    if (!room) return null;

    // Where the contender sits now, so the card can say something truer than
    // the amount alone: a $5 pledge that takes the lead is the better story.
    const { data: siblings } = await supabase
      .from("room_contenders")
      .select("id, current_votes")
      .eq("room_id", room.id);

    const ranked = [...(siblings ?? [])].sort(
      (a, b) => (Number(b.current_votes) || 0) - (Number(a.current_votes) || 0)
    );

    const index = ranked.findIndex((r) => r.id === vote.contender_id);
    const mine = Number(ranked[index]?.current_votes) || 0;
    const pool = ranked.reduce((sum, r) => sum + (Number(r.current_votes) || 0), 0);

    return {
      id: vote.id,
      paymentId,
      amount: Number(vote.amount) || 0,
      message: vote.message,
      voterName: vote.voter_name,
      voterAvatar: vote.voter_avatar,
      voterId: vote.voter_id,
      createdAt: vote.created_at,
      contender: {
        name: entity?.name ?? "Contender",
        image: entity?.image_url ?? null,
        color: entity?.brand_color ?? null,
        entityId: entity?.id ?? null,
        xHandle: entity?.x_handle ?? null,
      },
      arena: {
        id: room.id,
        title: room.title,
        category: room.category,
        roomType: room.room_type,
        totalPool: Number(room.total_pool) || 0,
        expiresAt: room.expires_at,
      },
      standing: {
        rank: index >= 0 ? index + 1 : ranked.length,
        of: ranked.length,
        share: pool > 0 ? Math.round((mine / pool) * 100) : 0,
        leading: index === 0,
      },
      charityName:
        room.charity_name && room.charity_name !== "Pending Charity" && room.charity_name !== "Demo Arena"
          ? room.charity_name
          : null,
    };
  } catch (error) {
    console.error("getPledgeByPaymentId failed:", error);
    return null;
  }
}
