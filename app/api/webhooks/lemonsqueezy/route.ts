import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Postgres unique_violation. `votes.polar_transaction_id` is unique, so a
// replayed delivery collides here instead of double-counting the pool.
const UNIQUE_VIOLATION = "23505";

/**
 * Lemon Squeezy signs the raw request body with HMAC-SHA256 and sends the hex
 * digest in `X-Signature`.
 */
function isValidSignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest();

  let received: Buffer;
  try {
    received = Buffer.from(signature, "hex");
  } catch {
    return false;
  }

  // timingSafeEqual throws on a length mismatch, so check that first —
  // the lengths themselves are not a secret.
  if (received.length !== expected.length) return false;

  return crypto.timingSafeEqual(received, expected);
}

type LemonSqueezyOrderPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string | undefined>;
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      subtotal_usd?: number;
      total_usd?: number;
    };
  };
};

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // The raw body is required: the signature covers the exact bytes sent, so
  // parsing to JSON first would invalidate it.
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 401 });
  }

  if (!isValidSignature(rawBody, signature, secret)) {
    console.error("Webhook Verification Failed: signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: LemonSqueezyOrderPayload;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  // Everything below returns 200: the delivery was authentic, it just isn't a
  // vote we need to record. A non-2xx would make Lemon Squeezy retry forever.
  if (payload.meta?.event_name !== "order_created") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const attributes = payload.data?.attributes;
  const orderId = payload.data?.id;

  // `order_created` also fires for pending and failed orders.
  if (attributes?.status !== "paid") {
    return NextResponse.json({ received: true, ignored: "unpaid" }, { status: 200 });
  }

  // Custom data lives on `meta`, NOT on the order attributes.
  const custom = payload.meta?.custom_data;

  if (custom?.type !== "battle_vote" || !custom.room_id || !custom.contender_id || !orderId) {
    return NextResponse.json({ received: true, ignored: "not a vote" }, { status: 200 });
  }

  // subtotal_usd is the pay-what-you-want price the voter actually chose,
  // normalised to USD cents. total_usd would fold in the tax Lemon Squeezy
  // collects as merchant of record and inflate the battle pool.
  const amountCents = attributes.subtotal_usd ?? 0;

  if (amountCents <= 0) {
    return NextResponse.json({ received: true, ignored: "zero amount" }, { status: 200 });
  }

  const voterName = custom.voter_name || "Anonymous";
  const supabase = createAdminClient();

  // A single insert is all we do: the on_vote_inserted trigger fans the amount
  // out to room_contenders, rooms.total_pool, entities.lifetime_raised and the
  // creator's wallet. Never touch those aggregates from here.
  const { error } = await supabase.from("votes").insert({
    polar_transaction_id: orderId, // column keeps its old name; holds the LS order id
    room_id: custom.room_id,
    contender_id: custom.contender_id,
    amount: amountCents / 100, // Lemon Squeezy sends cents, we store dollars
    voter_name: voterName,
    message: custom.message || null,
    voter_avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(voterName)}`,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      // Already recorded on an earlier delivery — ack so retries stop.
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    console.error("Database Insert Error:", error);
    // 500 so Lemon Squeezy retries rather than dropping a paid vote.
    return NextResponse.json({ error: "DB Error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
