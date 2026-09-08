import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe, toDollars } from "@/lib/stripe";
import { generatedAvatar } from "@/lib/avatar";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendVoteReceipt, sendRoomLive } from "@/lib/email/send";

// Postgres unique_violation. The transaction-id column is unique, so a
// replayed delivery collides here instead of double-counting the pool.
const UNIQUE_VIOLATION = "23505";

// What each prepaid pass is worth.
const ROOMS_PER_PASS = 5;
const CONTENDERS_PER_PASS = 5;

/**
 * Stripe webhook.
 *
 * Stripe signs the raw body, so this route must read `req.text()` and never a
 * parsed object — Next does not parse a Route Handler's body for you, which is
 * what makes that safe here.
 *
 * Everything the handler needs travels in the session's `metadata`, set when
 * the checkout was created server-side, so no database id is ever taken from
 * the browser.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 401 });
  }

  let event: Stripe.Event;

  try {
    // Verifies the signature and the timestamp window in one call.
    event = stripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    console.error("Stripe signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Card payments complete synchronously; the async event covers the delayed
  // methods (bank debits) where the session finishes before the money lands.
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true, ignored: event.type }, { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // A completed session is not a paid one for delayed payment methods.
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, ignored: "unpaid" }, { status: 200 });
  }

  const meta = session.metadata ?? {};

  if (!meta.type) {
    return NextResponse.json({ received: true, ignored: "no metadata type" }, { status: 200 });
  }

  // The payment intent, not the session: a refund reconciliation reads the
  // intent, and sessions expire out of the API after 30 days. Falls back to
  // the session id so the unique key is never null.
  const paymentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? session.id;

  const email = session.customer_details?.email ?? null;
  const supabase = createAdminClient();

  // ==========================================
  // SCENARIO 1: A USER BOUGHT A VOTE ($3+)
  // ==========================================
  if (meta.type === "battle_vote") {
    if (!meta.room_id || !meta.contender_id) {
      return NextResponse.json({ received: true, ignored: "invalid vote payload" }, { status: 200 });
    }

    // Subtotal, not total: with Stripe Tax on, the buyer's tax sits in
    // amount_total and would inflate the pool. Falls back to the total for
    // accounts with no tax configured, where the two are equal anyway.
    const amountCents = session.amount_subtotal ?? session.amount_total ?? 0;

    if (amountCents <= 0) {
      return NextResponse.json({ received: true, ignored: "zero amount" }, { status: 200 });
    }

    const voterName = meta.voter_name || "Anonymous";

    const { error } = await supabase.from("votes").insert({
      // Legacy column name from an earlier provider; it holds the Stripe
      // payment id now, and its unique constraint is the idempotency key.
      polar_transaction_id: paymentId,
      room_id: meta.room_id,
      contender_id: meta.contender_id,
      voter_id: meta.voter_id || null,
      amount: toDollars(amountCents),
      voter_name: voterName,
      message: meta.message || null,
      voter_avatar: generatedAvatar(voterName),
    });

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }

      // The reason travels back in the body. Stripe's event log is the one
      // place you can read it when a paid order fails to record.
      console.error("Vote Insert Error:", error);
      return NextResponse.json(
        { error: "DB Error", reason: error.message, code: error.code },
        { status: 500 }
      );
    }

    // Receipt. Deliberately not awaited into the response contract: a Resend
    // outage must never turn a paid vote into a 500 and a webhook retry.
    if (email) {
      const { data: room } = await supabase
        .from("rooms")
        .select("title, room_type")
        .eq("id", meta.room_id)
        .single();

      const { data: contender } = await supabase
        .from("room_contenders")
        .select("entities ( name )")
        .eq("id", meta.contender_id)
        .single();

      await sendVoteReceipt(email, {
        voterName,
        contender:
          (contender?.entities as unknown as { name?: string } | null)?.name ?? "your contender",
        amount: toDollars(amountCents),
        roomTitle: room?.title ?? "the arena",
        roomId: meta.room_id,
        roomType: room?.room_type,
      });
    }

    return NextResponse.json({ received: true, action: "vote_processed" }, { status: 200 });
  }

  // ==========================================
  // SCENARIO 2: A CREATOR DEPLOYED A ROOM ($10)
  // ==========================================
  if (meta.type === "creator_pass") {
    if (!meta.room_id) {
      return NextResponse.json({ received: true, ignored: "missing room_id" }, { status: 200 });
    }

    // The .eq on pending_payment doubles as replay protection: a redelivered
    // webhook matches no rows, so credits are granted exactly once below.
    const { data: activated, error } = await supabase
      .from("rooms")
      .update({ status: "active" })
      .eq("id", meta.room_id)
      .eq("status", "pending_payment")
      .select("id, creator_id");

    if (error) {
      console.error("Room Activation Error:", error);
      return NextResponse.json(
        { error: "DB Error", reason: error.message, code: error.code },
        { status: 500 }
      );
    }

    // A $10 pass buys 5 deployments. This one consumed the first, so grant
    // the remaining 4. Only runs when the update actually flipped a row.
    const creatorId = activated?.[0]?.creator_id;

    if (creatorId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("room_credits")
        .eq("id", creatorId)
        .single();

      const { error: creditError } = await supabase
        .from("profiles")
        .update({ room_credits: (profile?.room_credits ?? 0) + ROOMS_PER_PASS - 1 })
        .eq("id", creatorId);

      if (creditError) console.error("Credit grant failed:", creditError);
    }

    if (email) {
      const { data: room } = await supabase
        .from("rooms")
        .select("title, expires_at, room_type")
        .eq("id", meta.room_id)
        .single();

      if (room) {
        await sendRoomLive(email, {
          title: room.title,
          roomId: meta.room_id,
          expiresAt: room.expires_at,
          roomType: room.room_type,
        });
      }
    }

    return NextResponse.json({ received: true, action: "room_activated" }, { status: 200 });
  }

  // ==========================================
  // SCENARIO 3: A USER INJECTED A CONTENDER ($5)
  // ==========================================
  if (meta.type === "contender_add") {
    if (!meta.room_id || !meta.entity_id) {
      return NextResponse.json({ received: true, ignored: "invalid contender payload" }, { status: 200 });
    }

    // seed_index decides display order, so continue the existing sequence
    // rather than colliding on 0.
    const { count } = await supabase
      .from("room_contenders")
      .select("id", { count: "exact", head: true })
      .eq("room_id", meta.room_id);

    const { error } = await supabase.from("room_contenders").insert({
      room_id: meta.room_id,
      entity_id: meta.entity_id,
      seed_index: count ?? 0,
    });

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }
      console.error("Contender Link Error:", error);
      return NextResponse.json(
        { error: "DB Error", reason: error.message, code: error.code },
        { status: 500 }
      );
    }

    // $5 buys 5 injections; this one used the first, so bank the other 4.
    if (meta.buyer_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("contender_credits")
        .eq("id", meta.buyer_id)
        .single();

      await supabase
        .from("profiles")
        .update({
          contender_credits: (profile?.contender_credits ?? 0) + CONTENDERS_PER_PASS - 1,
        })
        .eq("id", meta.buyer_id);
    }

    return NextResponse.json({ received: true, action: "contender_added" }, { status: 200 });
  }

  return NextResponse.json({ received: true, ignored: "unknown type" }, { status: 200 });
}
