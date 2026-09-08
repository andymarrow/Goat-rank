import "server-only";

import Stripe from "stripe";

/**
 * Stripe client, created on first use.
 *
 * Not at module scope: a client that throws on a missing key would break
 * `next build` during page-data collection, the same way the Lemon Squeezy
 * setup did. Server-only — the secret key must never reach a bundle, and
 * hosted Checkout means the browser needs no Stripe code at all.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");

  client = new Stripe(key, {
    // Pinned deliberately: an account-level API version change should not
    // reshape the objects this code reads.
    apiVersion: "2026-08-26.dahlia",
    appInfo: { name: "GOAT Rank", url: "https://goatrank.lol" },
  });

  return client;
}

/** Dollars in Postgres, cents at Stripe. */
export const toCents = (dollars: number) => Math.round(dollars * 100);
export const toDollars = (cents: number) => cents / 100;

/**
 * Stripe caps a metadata value at 500 characters and drops the key entirely if
 * the value is empty, so both are enforced before the object is sent.
 */
export function metadata(fields: Record<string, string | null | undefined>) {
  const clean: Record<string, string> = {};

  for (const [key, value] of Object.entries(fields)) {
    const trimmed = value?.toString().trim();
    if (trimmed) clean[key] = trimmed.slice(0, 500);
  }

  return clean;
}
