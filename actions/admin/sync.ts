"use server";

import { revalidatePath } from "next/cache";
import { stripe, toDollars } from "@/lib/stripe";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";

export type SyncReport = {
  ordersScanned: number;
  refundsFound: number;
  refundsApplied: number;
  missingInDb: { orderId: string; total: number; refunded: boolean }[];
  reversedTotal: number;
};

/**
 * Cross-reference Stripe payments against the `votes` table.
 *
 * Catches the two ways the ledger drifts:
 *  - a payment was refunded or charged back at Stripe but the vote is still
 *    counted here (fixed automatically — flipping `refunded` fires the
 *    on_vote_refunded trigger, which reverses pool, entity and wallet),
 *  - a succeeded payment with no matching vote row, meaning a webhook delivery
 *    was lost (reported, not auto-fixed: re-inserting needs the metadata the
 *    payment carries, so it wants a human look — and Stripe can resend the
 *    event, which is the better repair).
 *
 * Reads charges rather than checkout sessions: a session drops out of the API
 * after 30 days, and the refund state lives on the charge — `refunded` and
 * `amount_refunded` are not fields of a payment intent. Each charge carries
 * the intent id we store, and the metadata copied from the intent.
 */
export async function syncStripe(): Promise<AdminResult<SyncReport>> {
  try {
    await requireAdmin();

    if (!process.env.STRIPE_SECRET_KEY) {
      return { ok: false, error: "Stripe is not configured." };
    }

    const charges = await stripe().charges.list({ limit: 100 });
    const supabase = createAdminClient();

    const { data: votes, error: voteError } = await supabase
      .from("votes")
      .select("id, polar_transaction_id, amount, refunded");

    if (voteError) throw voteError;

    const byPaymentId = new Map(
      (votes ?? []).map((v) => [String(v.polar_transaction_id), v])
    );

    const report: SyncReport = {
      ordersScanned: charges.data.length,
      refundsFound: 0,
      refundsApplied: 0,
      missingInDb: [],
      reversedTotal: 0,
    };

    for (const charge of charges.data) {
      // Only a vote carries this type; passes and injections have no row in
      // `votes` and must not be reported as missing.
      if (charge.metadata?.type !== "battle_vote") continue;

      const paymentId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id ?? charge.id;

      const isRefunded = charge.refunded || (charge.amount_refunded ?? 0) > 0;
      const vote = byPaymentId.get(paymentId);

      if (!vote) {
        if (charge.status === "succeeded" && !isRefunded) {
          report.missingInDb.push({
            orderId: paymentId,
            total: toDollars(charge.amount_captured || charge.amount),
            refunded: false,
          });
        }
        continue;
      }

      if (isRefunded) {
        report.refundsFound += 1;

        if (!vote.refunded) {
          // The trigger does the reversal; we only flip the flag.
          const { error } = await supabase
            .from("votes")
            .update({ refunded: true, refunded_at: new Date().toISOString() })
            .eq("id", vote.id)
            .eq("refunded", false);

          if (error) {
            console.error(`Refund reversal failed for vote ${vote.id}:`, error);
            continue;
          }

          report.refundsApplied += 1;
          report.reversedTotal += Number(vote.amount) || 0;
        }
      }
    }

    revalidatePath("/admin");
    revalidatePath("/");

    return { ok: true, data: report };
  } catch (error) {
    return adminError(error, "Could not reconcile Stripe payments.");
  }
}
