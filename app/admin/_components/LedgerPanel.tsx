"use client";

import { useState } from "react";
import { Download, BadgeCheck, X, Check } from "lucide-react";

import type { AdminPayout, CharityRow } from "@/actions/admin/payouts";
import { setPayoutStatus, exportCharityCsv } from "@/actions/admin/payouts";
import {
  Panel, ActionButton, Badge, EmptyState, Scroller, inputClass, money,
} from "./AdminPrimitives";

const tone = (s: AdminPayout["status"]) =>
  s === "paid" ? "good" : s === "rejected" ? "bad" : s === "approved" ? "hot" : "warn";

export default function LedgerPanel({
  payouts,
  charityLedger,
}: {
  payouts: AdminPayout[];
  charityLedger: CharityRow[];
}) {
  const [reference, setReference] = useState<Record<string, string>>({});

  const queued = payouts.filter((p) => p.status === "requested" || p.status === "approved");
  const charityTotal = charityLedger.reduce((sum, r) => sum + Number(r.charity_owed ?? 0), 0);

  /**
   * Build the CSV on the server, then hand it to the browser as a Blob. The
   * file never round-trips through a URL, so nothing is cached or shareable.
   */
  const downloadCsv = async () => {
    const res = await exportCharityCsv();
    if (!res.ok) return res;

    const blob = new Blob([res.data.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = res.data.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    return { ok: true as const };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* --------------------------------------------------- PAYOUT QUEUE */}
      <Panel
        title="Creator payout queue"
        subtitle="Marking paid also debits the creator's wallet, so the same money can't be claimed twice."
        action={<Badge tone={queued.length > 0 ? "hot" : "neutral"}>{queued.length} queued</Badge>}
      >
        {payouts.length === 0 ? (
          <EmptyState message="No payout requests yet" />
        ) : (
          <Scroller>
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Creator", "Requested", "Amount", "Wallet", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="py-2 pr-3 font-arcade text-[9px] uppercase tracking-widest text-foreground/40"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-3 pr-3 font-arcade text-xs text-foreground">
                      {p.profiles?.username ?? "unnamed"}
                    </td>
                    <td className="py-3 pr-3 text-[11px] text-foreground/45 font-sans whitespace-nowrap">
                      {new Date(p.requested_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-3 font-arcade text-xs tabular-nums text-battle-green">
                      {money(p.amount)}
                    </td>
                    <td className="py-3 pr-3 font-arcade text-xs tabular-nums text-foreground/50">
                      {money(p.profiles?.wallet_balance ?? 0)}
                    </td>
                    <td className="py-3 pr-3">
                      <Badge tone={tone(p.status)}>{p.status}</Badge>
                    </td>
                    <td className="py-3">
                      {p.status === "paid" || p.status === "rejected" ? (
                        <span className="text-[10px] text-foreground/30 font-sans">
                          {p.payout_reference || "—"}
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-start gap-2">
                          <input
                            value={reference[p.id] ?? ""}
                            onChange={(e) => setReference({ ...reference, [p.id]: e.target.value })}
                            placeholder="Transfer ref"
                            aria-label="Payout reference"
                            className={`${inputClass} w-32`}
                          />
                          {p.status === "requested" && (
                            <ActionButton onRun={() => setPayoutStatus(p.id, "approved")}>
                              <BadgeCheck className="w-3 h-3" /> Approve
                            </ActionButton>
                          )}
                          <ActionButton
                            variant="primary"
                            confirm="Mark paid?"
                            onRun={() => setPayoutStatus(p.id, "paid", reference[p.id])}
                          >
                            <Check className="w-3 h-3" /> Paid
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            confirm="Reject?"
                            onRun={() => setPayoutStatus(p.id, "rejected", reference[p.id])}
                          >
                            <X className="w-3 h-3" />
                          </ActionButton>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Scroller>
        )}
      </Panel>

      {/* ------------------------------------------------- CHARITY LEDGER */}
      <Panel
        title="Charity ledger"
        subtitle="30% of every settled arena's pool, grouped by charity."
        action={
          <ActionButton variant="primary" onRun={downloadCsv}>
            <Download className="w-3 h-3" /> Export CSV
          </ActionButton>
        }
      >
        {charityLedger.length === 0 ? (
          <EmptyState message="Nothing owed — no arenas have settled yet" />
        ) : (
          <>
            <Scroller>
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Charity", "Payout reference", "Rooms", "Gross pool", "Owed"].map((h) => (
                      <th
                        key={h}
                        className="py-2 pr-3 font-arcade text-[9px] uppercase tracking-widest text-foreground/40"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {charityLedger.map((row) => (
                    <tr key={row.charity_name ?? "unassigned"} className="border-b border-border/50">
                      <td className="py-3 pr-3 font-arcade text-xs text-foreground">
                        {row.charity_name ?? "Unassigned"}
                      </td>
                      <td className="py-3 pr-3 text-[11px] font-sans text-foreground/45">
                        {row.payout_reference ?? (
                          <span className="text-battle-yellow">not set</span>
                        )}
                      </td>
                      <td className="py-3 pr-3 font-arcade text-xs tabular-nums text-foreground/60">
                        {row.room_count}
                      </td>
                      <td className="py-3 pr-3 font-arcade text-xs tabular-nums text-foreground/60">
                        {money(row.gross_pool)}
                      </td>
                      <td className="py-3 pr-3 font-arcade text-xs tabular-nums text-battle-pink">
                        {money(row.charity_owed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Scroller>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/40">
                Total owed to charities
              </span>
              <span className="font-arcade text-xl font-black tabular-nums text-battle-pink">
                {money(charityTotal)}
              </span>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
