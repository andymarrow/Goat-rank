import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // stripe@22 types this field to its own pinned version ("2026-08-26.dahlia"),
  // so holding the wire format at acacia needs the cast. Delete this option
  // entirely to run on the version the installed SDK was generated against.
  apiVersion: "2024-12-18.acacia" as unknown as Stripe.LatestApiVersion,
});

// Postgres unique_violation. `votes.polar_transaction_id` is unique, so a
// replayed Stripe delivery collides here instead of double-counting the pool.
const UNIQUE_VIOLATION = "23505";

export async function POST(req: Request) {
  // The raw body is required: Stripe signs the exact bytes it sent, so parsing
  // to JSON first would invalidate the signature.
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 401 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook Verification Failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const session = event.data.object;
  const meta = session.metadata;

  // Delayed methods can complete the session while the money is still pending.
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (meta?.type !== "battle_vote" || !meta.room_id || !meta.contender_id) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const voterName = meta.voter_name || "Anonymous";
  const supabase = createAdminClient();

  // A single insert is all we do: the on_vote_inserted trigger fans the amount
  // out to room_contenders, rooms.total_pool, entities.lifetime_raised and the
  // creator's wallet. Never touch those aggregates from here.
  const { error } = await supabase.from("votes").insert({
    polar_transaction_id: session.id,
    room_id: meta.room_id,
    contender_id: meta.contender_id,
    amount: (session.amount_total ?? 0) / 100, // Stripe sends cents, we store dollars
    voter_name: voterName,
    message: meta.message || null,
    voter_avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(voterName)}`,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      // Already recorded on an earlier delivery — ack so Stripe stops retrying.
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    console.error("Database Insert Error:", error);
    // 500 so Stripe retries with backoff rather than dropping a paid vote.
    return NextResponse.json({ error: "DB Error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
