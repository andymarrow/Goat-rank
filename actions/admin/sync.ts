"use server";

import { revalidatePath } from "next/cache";
import { listOrders, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";

export type SyncReport = {
  ordersScanned: number;
  refundsFound: number;
  refundsApplied: number;
  missingInDb: { orderId: string; total: number; refunded: boolean }[];
  reversedTotal: number;
};

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
 * Cross-reference Lemon Squeezy orders against the `votes` table.
 *
 * Catches the two ways the ledger drifts:
 *  - an order was refunded or charged back at Lemon Squeezy but the vote is
 *    still counted here (fixed automatically — flipping `refunded` fires the
 *    on_vote_refunded trigger, which reverses pool, entity and wallet),
 *  - an order exists at Lemon Squeezy with no matching vote row, meaning a
 *    webhook delivery was lost (reported, not auto-fixed: re-inserting would
 *    need the custom_data the order carries, so it wants a human look).
 */
export async function syncLemonSqueezy(): Promise<AdminResult<SyncReport>> {
  try {
    await requireAdmin();

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    if (!storeId || !process.env.LEMONSQUEEZY_API_KEY) {
      return { ok: false, error: "Lemon Squeezy is not configured." };
    }

    ensureConfigured();

    const { data: orders, error: lsError } = await listOrders({
      filter: { storeId },
      page: { size: 100 },
    });

    if (lsError) {
      console.error("Lemon Squeezy listOrders failed:", lsError);
      return { ok: false, error: "Could not reach Lemon Squeezy." };
    }

    const rows = orders?.data ?? [];
    const supabase = createAdminClient();

    const { data: votes, error: voteError } = await supabase
      .from("votes")
      .select("id, polar_transaction_id, amount, refunded");

    if (voteError) throw voteError;

    const byOrderId = new Map(
      (votes ?? []).map((v) => [String(v.polar_transaction_id), v])
    );

    const report: SyncReport = {
      ordersScanned: rows.length,
      refundsFound: 0,
      refundsApplied: 0,
      missingInDb: [],
      reversedTotal: 0,
    };

    for (const order of rows) {
      const orderId = String(order.id);
      const attrs = order.attributes;
      const isRefunded = Boolean(attrs.refunded) || attrs.status === "refunded";
      const vote = byOrderId.get(orderId);

      if (!vote) {
        // Only paid, non-refunded orders are a real gap worth chasing.
        if (attrs.status === "paid" && !isRefunded) {
          report.missingInDb.push({
            orderId,
            total: (attrs.subtotal_usd ?? 0) / 100,
            refunded: isRefunded,
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
    return adminError(error, "Sync failed.");
  }
}
