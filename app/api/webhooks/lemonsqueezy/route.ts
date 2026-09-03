import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendVoteReceipt, sendRoomLive } from "@/lib/email/send";

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
      user_email?: string;
      user_name?: string;
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

    // Receipt. Deliberately not awaited into the response contract: a Resend
    // outage must never turn a paid vote into a 500 and a webhook retry.
    if (attributes.user_email) {
      const { data: room } = await supabase
        .from("rooms")
        .select("title, room_type")
        .eq("id", custom.room_id)
        .single();

      const { data: contender } = await supabase
        .from("room_contenders")
        .select("entities ( name )")
        .eq("id", custom.contender_id)
        .single();

      await sendVoteReceipt(attributes.user_email, {
        voterName,
        contender:
          (contender?.entities as unknown as { name?: string } | null)?.name ?? "your contender",
        amount: amountCents / 100,
        roomTitle: room?.title ?? "the arena",
        roomId: custom.room_id,
        roomType: room?.room_type,
      });
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

    if (attributes.user_email) {
      const { data: room } = await supabase
        .from("rooms")
        .select("title, expires_at, room_type")
        .eq("id", custom.room_id)
        .single();

      if (room) {
        await sendRoomLive(attributes.user_email, {
          title: room.title,
          roomId: custom.room_id,
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
  if (custom.type === "contender_add") {
    if (!custom.room_id || !custom.entity_id) {
      return NextResponse.json({ received: true, ignored: "invalid contender payload" }, { status: 200 });
    }

    // seed_index decides display order, so continue the existing sequence
    // rather than colliding on 0.
    const { count } = await supabase
      .from("room_contenders")
      .select("id", { count: "exact", head: true })
      .eq("room_id", custom.room_id);

    const { error } = await supabase.from("room_contenders").insert({
      room_id: custom.room_id,
      entity_id: custom.entity_id,
      seed_index: count ?? 0,
    });

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }
      console.error("Contender Link Error:", error);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    return NextResponse.json({ received: true, action: "contender_added" }, { status: 200 });
  }

  // Fallback for unknown types
  return NextResponse.json({ received: true, ignored: "unknown type" }, { status: 200 });
}