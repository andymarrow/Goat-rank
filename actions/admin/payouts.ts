"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin, adminError, type AdminResult } from "@/utils/supabase/admin-auth";
import { sendPayoutPaid } from "@/lib/email/send";

export type AdminPayout = {
  id: string;
  profile_id: string;
  amount: number;
  status: "requested" | "approved" | "paid" | "rejected";
  requested_at: string;
  processed_at: string | null;
  payout_reference: string | null;
  notes: string | null;
  profiles: { username: string | null; wallet_balance: number } | null;
};

export type CharityRow = {
  charity_name: string | null;
  payout_reference: string | null;
  room_count: number;
  gross_pool: number;
  charity_owed: number;
  first_settled_at: string | null;
  last_settled_at: string | null;
};

export async function listPayoutRequests(): Promise<AdminPayout[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("payout_requests")
    .select(
      `id, profile_id, amount, status, requested_at, processed_at,
       payout_reference, notes, profiles ( username, wallet_balance )`
    )
    .order("requested_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("listPayoutRequests failed:", error);
    return [];
  }

  return (data ?? []) as unknown as AdminPayout[];
}

export async function listCharityLedger(): Promise<CharityRow[]> {
  await requireAdmin();

  const { data, error } = await createAdminClient()
    .from("charity_ledger")
    .select("*")
    .order("charity_owed", { ascending: false });

  if (error) {
    console.error("listCharityLedger failed:", error);
    return [];
  }

  return (data ?? []) as CharityRow[];
}

/**
 * Mark a payout paid and debit the creator's wallet in the same step.
 *
 * The debit is the whole point: wallet_balance is what the creator can still
 * withdraw, so paying without debiting would let them request the same money
 * again. total_earned is lifetime and deliberately left alone.
 */
export async function setPayoutStatus(
  payoutId: string,
  status: "approved" | "paid" | "rejected",
  reference?: string
): Promise<AdminResult> {
  try {
    const admin = await requireAdmin();
    const supabase = createAdminClient();

    const { data: payout, error: readError } = await supabase
      .from("payout_requests")
      .select("id, profile_id, amount, status")
      .eq("id", payoutId)
      .single();

    if (readError) throw readError;
    if (!payout) return { ok: false, error: "Payout request not found." };
    if (payout.status === "paid") return { ok: false, error: "Already marked paid." };

    if (status === "paid") {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", payout.profile_id)
        .single();

      if (profileError) throw profileError;

      const balance = Number(profile?.wallet_balance) || 0;
      const amount = Number(payout.amount) || 0;

      if (amount > balance) {
        return {
          ok: false,
          error: `Request is $${amount.toFixed(2)} but the wallet only holds $${balance.toFixed(2)}.`,
        };
      }

      const { error: debitError } = await supabase
        .from("profiles")
        .update({ wallet_balance: balance - amount })
        .eq("id", payout.profile_id);

      if (debitError) throw debitError;
    }

    const { error } = await supabase
      .from("payout_requests")
      .update({
        status,
        processed_at: new Date().toISOString(),
        processed_by: admin.id,
        payout_reference: reference?.trim().slice(0, 200) ?? null,
      })
      .eq("id", payoutId)
      .neq("status", "paid");

    if (error) throw error;

    // Tell the creator their money is moving. Best-effort: a failed email
    // must not undo a payout that has already been marked paid.
    if (status === "paid") {
      const { data: authUser } = await supabase.auth.admin.getUserById(payout.profile_id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", payout.profile_id)
        .single();

      if (authUser?.user?.email) {
        await sendPayoutPaid(authUser.user.email, {
          name: profile?.username ?? "creator",
          amount: Number(payout.amount) || 0,
          reference,
        });
      }
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return adminError(error, "Could not update the payout.");
  }
}

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  // Quote when the value contains a delimiter, quote or newline; double inner quotes.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** End-of-month charity export. Returns CSV text for the browser to download. */
export async function exportCharityCsv(): Promise<AdminResult<{ csv: string; filename: string }>> {
  try {
    await requireAdmin();
    const rows = await listCharityLedger();

    const header = [
      "charity_name",
      "payout_reference",
      "settled_rooms",
      "gross_pool_usd",
      "charity_owed_usd",
      "first_settled_at",
      "last_settled_at",
    ];

    const body = rows.map((r) =>
      [
        r.charity_name,
        r.payout_reference,
        r.room_count,
        Number(r.gross_pool ?? 0).toFixed(2),
        Number(r.charity_owed ?? 0).toFixed(2),
        r.first_settled_at,
        r.last_settled_at,
      ]
        .map(csvCell)
        .join(",")
    );

    const total = rows.reduce((sum, r) => sum + Number(r.charity_owed ?? 0), 0);
    body.push(["TOTAL", "", "", "", total.toFixed(2), "", ""].map(csvCell).join(","));

    return {
      ok: true,
      data: {
        csv: [header.join(","), ...body].join("\n"),
        filename: `goatrank-charity-${new Date().toISOString().slice(0, 10)}.csv`,
      },
    };
  } catch (error) {
    return adminError(error, "Could not build the charity export.");
  }
}
