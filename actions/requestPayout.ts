"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { MIN_PAYOUT_USD } from "@/lib/constants";

/**
 * Queue a withdrawal of the creator's commission.
 *
 * Only creates the request — the wallet is debited in the admin console when
 * the payout is actually marked paid, so the money is never in two places.
 */
export async function requestPayout(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "You must be signed in." };

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("wallet_balance, is_banned")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("requestPayout: profile read failed", profileError);
    return { ok: false, error: "Could not read your wallet." };
  }

  if (profile.is_banned) {
    return { ok: false, error: "Withdrawals are suspended on this account." };
  }

  const balance = Number(profile.wallet_balance) || 0;

  if (balance < MIN_PAYOUT_USD) {
    return {
      ok: false,
      error: `You need at least $${MIN_PAYOUT_USD} to withdraw. Balance: $${balance.toFixed(2)}.`,
    };
  }

  // One open request at a time, or the queue fills with duplicates of the
  // same balance and an admin could pay it out twice.
  const { count } = await admin
    .from("payout_requests")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .in("status", ["requested", "approved"]);

  if ((count ?? 0) > 0) {
    return { ok: false, error: "You already have a payout in the queue." };
  }

  const { error } = await admin.from("payout_requests").insert({
    profile_id: user.id,
    amount: balance,
    status: "requested",
  });

  if (error) {
    console.error("requestPayout: insert failed", error);
    return { ok: false, error: "Could not queue the payout." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { ok: true };
}
