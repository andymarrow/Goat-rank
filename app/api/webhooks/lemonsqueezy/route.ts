import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Postgres unique_violation. The transaction-id column is unique, so a
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

  if (payload.meta?.event_name !== "order_created") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const attributes = payload.data?.attributes;
  const orderId = payload.data?.id;

  if (attributes?.status !== "paid") {
    return NextResponse.json({ received: true, ignored: "unpaid" }, { status: 200 });
  }

  const custom = payload.meta?.custom_data;

  // If there is no custom data type, we ignore it.
  if (!custom?.type || !orderId) {
    return NextResponse.json({ received: true, ignored: "missing custom data" }, { status: 200 });
  }

  const supabase = createAdminClient();

  // ==========================================
  // SCENARIO 1: A USER BOUGHT A VOTE ($3+)
  // ==========================================
  if (custom.type === "battle_vote") {
    if (!custom.room_id || !custom.contender_id) {
      return NextResponse.json({ received: true, ignored: "invalid vote payload" }, { status: 200 });
    }

    const amountCents = attributes.subtotal_usd ?? 0;
    if (amountCents <= 0) {
      return NextResponse.json({ received: true, ignored: "zero amount" }, { status: 200 });
    }

    const voterName = custom.voter_name || "Anonymous";

    const { error } = await supabase.from("votes").insert({
      polar_transaction_id: orderId,
      room_id: custom.room_id,
      contender_id: custom.contender_id,
      amount: amountCents / 100, 
      voter_name: voterName,
      message: custom.message || null,
      voter_avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(voterName)}`,
    });

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }
      console.error("Vote Insert Error:", error);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    return NextResponse.json({ received: true, action: "vote_processed" }, { status: 200 });
  }


  // ==========================================
  // SCENARIO 2: A CREATOR DEPLOYED A ROOM ($10)
  // ==========================================
  if (custom.type === "creator_pass") {
    if (!custom.room_id) {
      return NextResponse.json({ received: true, ignored: "missing room_id for creator pass" }, { status: 200 });
    }

    // Set the room status to 'active' so it shows up on the homepage!
    const { error } = await supabase
      .from("rooms")
      .update({ status: "active" })
      .eq("id", custom.room_id)
      .eq("status", "pending_payment"); // Extra safety check

    if (error) {
      console.error("Room Activation Error:", error);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    return NextResponse.json({ received: true, action: "room_activated" }, { status: 200 });
  }

  // Fallback for unknown types
  return NextResponse.json({ received: true, ignored: "unknown type" }, { status: 200 });
}