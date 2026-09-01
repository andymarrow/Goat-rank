"use server";

import { headers } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // stripe@22 types this field to its own pinned version ("2026-08-26.dahlia"),
  // so holding the wire format at acacia needs the cast. Delete this option
  // entirely to run on the version the installed SDK was generated against.
  apiVersion: "2024-12-18.acacia" as unknown as Stripe.LatestApiVersion,
});

// Mirrors the minimum enforced by the VoteModal input. A Server Action is a
// public HTTP endpoint, so the client-side `min` attribute proves nothing.
const MIN_VOTE_USD = 3;

// Stripe caps each metadata value at 500 characters.
const MAX_METADATA_VALUE = 500;

/**
 * Checkout runs on our own domain, so we can rebuild the absolute return URLs
 * from the incoming request instead of requiring a NEXT_PUBLIC_SITE_URL.
 * An explicit env var still wins when one is set (useful behind a proxy).
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

  try {
    const origin = await resolveOrigin();

    // Stripe bills in the currency's smallest unit and rejects non-integers,
    // so round rather than trusting float math on a custom dollar amount.
    const unitAmount = Math.round(data.amount * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: "GOAT Rank Battle Vote",
              description: "Backs your contender and grows the battle pool.",
            },
          },
        },
      ],
      // IMPORTANT: our database IDs ride along in metadata so the webhook can
      // attribute the vote without ever trusting the browser for them.
      metadata: {
        type: "battle_vote",
        room_id: data.roomId,
        contender_id: data.contenderId,
        message: data.message.slice(0, MAX_METADATA_VALUE),
        voter_name: data.voterName.slice(0, MAX_METADATA_VALUE),
      },
      success_url: `${origin}/battle/${data.roomId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/battle/${data.roomId}?canceled=true`,
    });

    if (!session.url) {
      return { error: "Stripe did not return a checkout URL." };
    }

    return { url: session.url };
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return { error: "Failed to initialize payment terminal." };
  }
}
