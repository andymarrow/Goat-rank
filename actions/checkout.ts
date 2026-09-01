"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { headers } from "next/headers";
import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

// Mirrors the minimum enforced by the VoteModal input. A Server Action is a
// public HTTP endpoint, so the client-side `min` attribute proves nothing.
const MIN_VOTE_USD = 3;

// Keeps a pasted essay out of the checkout payload and the DB.
const MAX_CUSTOM_VALUE = 500;

/**
 * The SDK holds its API key in module-global state, so this only needs to run
 * once per server instance. It runs lazily inside the action rather than at
 * module scope on purpose: a module-scope client that throws on a missing key
 * breaks `next build` during page-data collection.
 */
let isConfigured = false;
function ensureConfigured() {
  if (isConfigured) return;

  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY,
    onError: (error) => console.error("Lemon Squeezy SDK error:", error),
  });

  isConfigured = true;
}

/**
 * Checkout runs on our own domain, so we can rebuild the absolute redirect URL
 * from the incoming request instead of depending on NEXT_PUBLIC_SITE_URL.
 * An explicit env var still wins when set (useful behind a proxy).
 */
async function resolveOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function createVoteCheckout(data: {
  amount: number;
  roomId: string;
  contenderId: string;
  message: string;
  voterName: string;
}): Promise<{ url?: string; error?: string }> {
  if (!Number.isFinite(data.amount) || data.amount < MIN_VOTE_USD) {
    return { error: `Minimum vote is $${MIN_VOTE_USD}.` };
  }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LS_VARIANT_VOTE;

  if (!storeId || !variantId || !process.env.LEMONSQUEEZY_API_KEY) {
    console.error("Lemon Squeezy env vars missing (store, variant or API key).");
    return { error: "Payment terminal is not configured." };
  }

  try {
    ensureConfigured();

    const origin = await resolveOrigin();

    // Pay-what-you-want: the variant's price is overridden per checkout.
    // Lemon Squeezy wants a positive integer in cents, so round rather than
    // trusting float math on a custom dollar amount.
    const customPrice = Math.round(data.amount * 100);

    const { data: checkout, error } = await createCheckout(storeId, variantId, {
      customPrice,
      productOptions: {
        name: "GOAT Rank Battle Vote",
        description: "Backs your contender and grows the battle pool.",
        // Lemon Squeezy has no cancel URL — only a post-purchase redirect.
        redirectUrl: `${origin}/battle/${data.roomId}?success=true`,
        receiptButtonText: "Back to the arena",
      },
      checkoutData: {
        // IMPORTANT: our database IDs ride along here so the webhook can
        // attribute the vote without ever trusting the browser for them.
        // Lemon Squeezy returns this under `meta.custom_data`, not on the
        // order attributes. Values must be strings — numbers and nested
        // objects come back inconsistently.
        custom: {
          type: "battle_vote",
          room_id: data.roomId,
          contender_id: data.contenderId,
          message: data.message.slice(0, MAX_CUSTOM_VALUE),
          voter_name: data.voterName.slice(0, MAX_CUSTOM_VALUE),
        },
      },
    });

    if (error) {
      console.error("Lemon Squeezy Checkout Error:", error);
      return { error: "Failed to initialize payment terminal." };
    }

    const url = checkout?.data.attributes.url;

    if (!url) {
      return { error: "Lemon Squeezy did not return a checkout URL." };
    }

    return { url };
  } catch (error) {
    console.error("Lemon Squeezy Checkout Error:", error);
    return { error: "Failed to initialize payment terminal." };
  }
}

export async function createRoomCheckout(data: {
  title: string;
  category: string;
  roomType: string;
  contenders: any[];
  creatorId?: string; // We will enforce auth later, optional for now
}): Promise<{ url?: string; error?: string }> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LS_VARIANT_CREATOR;

  if (!storeId || !variantId) {
    return { error: "Payment terminal is not configured." };
  }

  try {
    ensureConfigured();
    const supabase = createAdminClient();

    // 1. Pre-build the room in Supabase as 'pending_payment'
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        title: data.title.slice(0, 100),
        category: data.category,
        room_type: data.roomType,
        status: "pending_payment", // <--- Crucial! Will be hidden from UI until paid.
        charity_name: "Pending Charity", // Can be customized later
        creator_id: data.creatorId || null,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      })
      .select("id")
      .single();

    if (roomError || !room) {
      console.error("DB Room Creation Error:", roomError);
      return { error: "Failed to initialize arena in database." };
    }

    // 2. Insert the Contenders
    for (let i = 0; i < data.contenders.length; i++) {
      const c = data.contenders[i];
      
      // Insert Entity (or find existing)
      const { data: entity } = await supabase
        .from("entities")
        .insert({
          name: c.name,
          category: data.category,
          brand_color: c.color,
          image_url: c.image,
        })
        .select("id")
        .single();

      if (entity) {
        // Link Entity to Room
        await supabase.from("room_contenders").insert({
          room_id: room.id,
          entity_id: entity.id,
          seed_index: i,
        });
      }
    }

    // 3. Request LemonSqueezy Checkout
    const origin = await resolveOrigin();

    const { data: checkout, error } = await createCheckout(storeId, variantId, {
      productOptions: {
        name: `Deploy Arena: ${data.title}`,
        description: `Unlocks 1 of your 3 Creator passes. 10% commission enabled.`,
        redirectUrl: `${origin}/dashboard?success=true`,
        receiptButtonText: "Go to Command Center",
      },
      checkoutData: {
        custom: {
          type: "creator_pass",
          room_id: room.id, // We only need to pass the ID!
        },
      },
    });

    if (error) return { error: "Failed to initialize payment terminal." };
    return { url: checkout?.data.attributes.url };
    
  } catch (error) {
    console.error("Lemon Squeezy Checkout Error:", error);
    return { error: "System failure." };
  }
}
