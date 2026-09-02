"use client";

import { useState } from "react";
import {
  DollarSign, HeartHandshake, Users, Swords, Zap, Vote,
  RefreshCw, Landmark, TriangleAlert,
} from "lucide-react";

import type { AdminOverview } from "@/actions/admin/analytics";
import { syncLemonSqueezy, type SyncReport } from "@/actions/admin/sync";
import { Panel, StatTile, ActionButton, money, compact, Badge } from "./AdminPrimitives";

export default function GodEyePanel({ overview }: { overview: AdminOverview }) {
  const { treasury, pulse, volumeSeries } = overview;
  const [report, setReport] = useState<SyncReport | null>(null);

  const peak = Math.max(...volumeSeries.map((p) => p.amount), 1);

  return (
    <div className="flex flex-col gap-6">
      {/* ------------------------------------------------------- TREASURY */}
      <Panel
        title="Treasury"
        subtitle="Gross pledged volume, split 60 house / 30 charity / 10 creator."
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            label="Total volume"
            value={money(treasury.grossVolume)}
            hint="All non-refunded votes"
            icon={<DollarSign className="w-4 h-4" />}
          />
          <StatTile
            label="House cut · 60%"
            value={money(treasury.platformCut)}
            accent="text-primary"
            hint="Before Lemon Squeezy fees"
            icon={<Landmark className="w-4 h-4" />}
          />
          <StatTile
            label="Charity · 30%"
            value={money(treasury.charityLocked)}
            accent="text-battle-pink"
            hint="Liability, not yet remitted"
            icon={<HeartHandshake className="w-4 h-4" />}
          />
          <StatTile
            label="Creators · 10%"
            value={money(treasury.creatorLocked)}
            accent="text-battle-green"
            hint="Credited per-vote by trigger"
            icon={<Users className="w-4 h-4" />}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatTile
            label="Creator wallets — owed now"
            value={money(treasury.creatorWalletOutstanding)}
            hint="Withdrawable balance across all creators"
          />
          <StatTile
            label="Creator payouts settled"
            value={money(treasury.creatorPaidOut)}
            hint="Lifetime earned minus current balances"
          />
        </div>

        <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-foreground/45 font-sans">
          <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-battle-yellow" />
          <span>
            These are <strong className="text-foreground/70">derived</strong> from vote volume, not a
            reconciled bank ledger. Only the creator 10% actually moves in the database. Lemon
            Squeezy&apos;s fee comes off what they remit, so the house figure is gross.
          </span>
        </p>
      </Panel>

      {/* ---------------------------------------------------------- PULSE */}
      <Panel title="Active pulse" subtitle="Right now, across the platform.">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            label="Live arenas"
            value={String(pulse.activeArenas)}
            hint={`${pulse.pendingArenas} awaiting payment`}
            accent="text-battle-green"
            icon={<Swords className="w-4 h-4" />}
          />
          <StatTile
            label="Votes today"
            value={compact(pulse.votesToday)}
            hint={`${money(pulse.volumeToday)} today`}
            accent="text-primary"
            icon={<Zap className="w-4 h-4" />}
          />
          <StatTile
            label="Total votes"
            value={compact(pulse.totalVotes)}
            icon={<Vote className="w-4 h-4" />}
          />
          <StatTile
            label="Registered users"
            value={compact(pulse.totalUsers)}
            icon={<Users className="w-4 h-4" />}
          />
        </div>

        {(pulse.pendingEntities > 0 || pulse.pendingPayouts > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {pulse.pendingEntities > 0 && (
              <Badge tone="warn">{pulse.pendingEntities} contenders awaiting review</Badge>
            )}
            {pulse.pendingPayouts > 0 && (
              <Badge tone="hot">{pulse.pendingPayouts} payouts queued</Badge>
            )}
          </div>
        )}
      </Panel>

      {/* -------------------------------------------------------- VOLUME */}
      <Panel title="Volume · last 14 days" subtitle="Gross pledged per UTC day.">
        <div
          className="flex items-end gap-1 h-40"
          role="img"
          aria-label={`Daily volume for the last 14 days, peaking at ${money(peak)}`}
        >
          {volumeSeries.map((point) => (
            <div key={point.day} className="group relative flex-1 flex flex-col justify-end h-full">
              <div
                className="w-full bg-primary/70 group-hover:bg-primary transition-colors cut-corner min-h-[2px]"
                style={{ height: `${Math.max((point.amount / peak) * 100, 1)}%` }}
              />
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100
                               transition-opacity font-arcade text-[9px] text-foreground whitespace-nowrap">
                {money(point.amount)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-arcade text-[9px] uppercase tracking-widest text-foreground/35">
          <span>{volumeSeries[0]?.day}</span>
          <span>Today</span>
        </div>
      </Panel>

      {/* ----------------------------------------------------------- SYNC */}
      <Panel
        title="Lemon Squeezy sync"
        subtitle="Cross-reference orders to catch refunds and chargebacks."
        action={
          <ActionButton
            variant="primary"
            onRun={async () => {
              const res = await syncLemonSqueezy();
              if (res.ok) setReport(res.data);
              return res;
            }}
          >
            <RefreshCw className="w-3 h-3" /> Run sync
          </ActionButton>
        }
      >
        {!report ? (
          <p className="text-xs text-foreground/45 font-sans leading-relaxed">
            Scans the most recent 100 orders. A refunded order flips its vote to{" "}
            <code className="text-foreground/70">refunded</code>, which fires the reversal trigger
            and backs the money out of the pool, the entity total and the creator&apos;s wallet.
            Orders with no matching vote are reported for you to inspect — those mean a webhook
            delivery was lost.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile label="Orders scanned" value={String(report.ordersScanned)} />
              <StatTile label="Refunds found" value={String(report.refundsFound)} />
              <StatTile
                label="Reversals applied"
                value={String(report.refundsApplied)}
                accent={report.refundsApplied > 0 ? "text-battle-yellow" : "text-foreground"}
              />
              <StatTile
                label="Value reversed"
                value={money(report.reversedTotal)}
                accent={report.reversedTotal > 0 ? "text-battle-red" : "text-foreground"}
              />
            </div>

            {report.missingInDb.length > 0 && (
              <div className="border border-battle-red/40 bg-battle-red/10 cut-corner p-3">
                <p className="font-arcade text-[10px] uppercase tracking-widest text-battle-red mb-2">
                  {report.missingInDb.length} paid order(s) with no vote row
                </p>
                <ul className="flex flex-col gap-1 font-sans text-[11px] text-foreground/70">
                  {report.missingInDb.slice(0, 10).map((m) => (
                    <li key={m.orderId} className="flex justify-between gap-3">
                      <code className="truncate">order {m.orderId}</code>
                      <span className="tabular-nums shrink-0">{money(m.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
