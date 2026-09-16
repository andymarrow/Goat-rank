"use client";

import Link from "next/link";
import {
  DollarSign, HeartHandshake, Users, Swords, Zap, Vote,
  RefreshCw, Landmark, TriangleAlert, ExternalLink,
} from "lucide-react";

import type { AdminOverview, ArenaPerformance } from "@/actions/admin/analytics";
import type { SyncReport } from "@/actions/admin/sync";
import { Panel, StatTile, money, compact, Badge, EmptyState } from "./AdminPrimitives";
import { formatSince } from "@/lib/time";

export default function GodEyePanel({
  overview,
  sync,
  syncError,
}: {
  overview: AdminOverview;
  sync: SyncReport | null;
  syncError: string | null;
}) {
  const {
    treasury, pulse, volumeSeries, topArenas, newestArenas, topContenders, closedWithRevenue,
  } = overview;

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
            hint="Before Stripe fees"
            icon={<Landmark className="w-4 h-4" />}
          />
          <StatTile
            label="Charity · 30%"
            value={money(treasury.charityLocked)}
            accent="text-pink-500"
            hint="Liability, not yet remitted"
            icon={<HeartHandshake className="w-4 h-4" />}
          />
          <StatTile
            label="Creators · 10%"
            value={money(treasury.creatorLocked)}
            accent="text-emerald-500"
            hint="Credited per-vote by trigger"
            icon={<Users className="w-4 h-4" />}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatTile
            label="Creator wallets: owed now"
            value={money(treasury.creatorWalletOutstanding)}
            hint="Withdrawable balance across all creators"
          />
          <StatTile
            label="Creator payouts settled"
            value={money(treasury.creatorPaidOut)}
            hint="Lifetime earned minus current balances"
          />
        </div>

        <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground font-sans">
          <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
          <span>
            These are <strong className="text-foreground/70">derived</strong> from vote volume, not a
            reconciled bank ledger. Only the creator 10% actually moves in the database. Stripe&apos;s
            fee comes out of the payout, so the house figure is gross.
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
            accent="text-emerald-500"
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
                className="w-full bg-primary/70 group-hover:bg-primary transition-colors rounded-xl min-h-[2px]"
                style={{ height: `${Math.max((point.amount / peak) * 100, 1)}%` }}
              />
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100
                               transition-opacity font-mono text-[9px] text-foreground whitespace-nowrap">
                {money(point.amount)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          <span>{volumeSeries[0]?.day}</span>
          <span>Today</span>
        </div>
      </Panel>

      {/* ------------------------------------------------ ARENA PERFORMANCE */}
      <Panel
        title="Arena performance"
        subtitle="Ranked by real money taken, not by the pool shown on the page."
        action={
          closedWithRevenue > 0 ? (
            <Badge tone="warn">{closedWithRevenue} closed with revenue</Badge>
          ) : undefined
        }
      >
        {topArenas.length === 0 ? (
          <EmptyState message="No arena has taken a real pledge yet" />
        ) : (
          <ArenaTable arenas={topArenas} />
        )}
      </Panel>

      {/* --------------------------------------------------- TOP CONTENDERS */}
      <Panel
        title="Most backed contenders"
        subtitle="Real pledges only, summed across every arena a contender appears in."
      >
        {topContenders.length === 0 ? (
          <EmptyState message="No contender has been backed with real money yet" />
        ) : (
          <ul className="flex flex-col gap-2">
            {topContenders.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center gap-3 p-2.5 bg-background border border-border/60 rounded-xl"
              >
                <span className="w-6 shrink-0 font-mono text-[11px] font-bold text-muted-foreground tabular-nums">
                  {i + 1}
                </span>

                <Link
                  href={`/profile/${c.id}`}
                  target="_blank"
                  className="font-mono text-[11px] font-bold text-foreground hover:text-primary
                             transition-colors truncate flex-1 min-w-0"
                >
                  {c.name}
                </Link>

                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                  {c.arenas} arena{c.arenas === 1 ? "" : "s"} · {c.realVotes} pledge
                  {c.realVotes === 1 ? "" : "s"}
                </span>

                <span className="text-sm font-extrabold text-emerald-500 tabular-nums shrink-0">
                  {money(c.realRevenue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* -------------------------------------------------------- NEW ARENAS */}
      <Panel
        title="Newest arenas"
        subtitle="What has been deployed lately, and whether anyone has paid into it."
      >
        {newestArenas.length === 0 ? (
          <EmptyState message="No arenas yet" />
        ) : (
          <ArenaTable arenas={newestArenas} showAge />
        )}
      </Panel>

      {/* ----------------------------------------------------------- SYNC */}
      <Panel
        title="Stripe reconciliation"
        subtitle="Run automatically on every load of this page."
        action={
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <RefreshCw className="w-3 h-3" /> Synced just now
          </span>
        }
      >
        {syncError ? (
          <p role="alert" className="text-[11px] text-red-500 font-sans">
            {syncError}
          </p>
        ) : !sync ? (
          <p className="text-xs text-muted-foreground font-sans">Nothing to reconcile yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile label="Charges scanned" value={String(sync.ordersScanned)} />
              <StatTile label="Refunds found" value={String(sync.refundsFound)} />
              <StatTile
                label="Reversals applied"
                value={String(sync.refundsApplied)}
                accent={sync.refundsApplied > 0 ? "text-amber-500" : "text-foreground"}
              />
              <StatTile
                label="Value reversed"
                value={money(sync.reversedTotal)}
                accent={sync.reversedTotal > 0 ? "text-red-500" : "text-foreground"}
              />
            </div>

            <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
              Reads the most recent 100 Stripe charges. A refunded payment flips its vote to{" "}
              <code className="text-foreground/70">refunded</code>, which fires the reversal trigger
              and backs the money out of the pool, the contender total and the creator&apos;s
              wallet. Every figure above this panel is computed after that has run.
            </p>

            {sync.missingInDb.length > 0 && (
              <div className="border border-red-500/40 bg-red-500/10 rounded-xl p-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-red-500 mb-2">
                  {sync.missingInDb.length} paid charge(s) with no vote row
                </p>
                <p className="text-[11px] text-foreground/70 font-sans mb-2">
                  Someone paid and the arena never recorded it. Resend the event from the Stripe
                  dashboard to repair each one.
                </p>
                <ul className="flex flex-col gap-1 font-sans text-[11px] text-foreground/70">
                  {sync.missingInDb.slice(0, 10).map((m) => (
                    <li key={m.orderId} className="flex justify-between gap-3">
                      <code className="truncate">{m.orderId}</code>
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

/**
 * Arenas with the two numbers side by side.
 *
 * `displayedPool` is what a visitor sees; `realRevenue` is what was actually
 * paid. On a seeded arena those differ, and showing only the first is how a
 * dashboard ends up reporting money that was never taken.
 */
function ArenaTable({ arenas, showAge = false }: { arenas: ArenaPerformance[]; showAge?: boolean }) {
  return (
    <ul className="flex flex-col gap-2">
      {arenas.map((a) => {
        const seeded = Math.max(0, a.displayedPool - a.realRevenue);

        return (
          <li
            key={a.id}
            className="flex flex-wrap items-center gap-3 p-3 bg-background border border-border/60 rounded-xl"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/arenas/${a.id}`}
                  className="font-mono text-[11px] font-bold text-foreground hover:text-primary transition-colors truncate"
                >
                  {a.title}
                </Link>
                <Badge>{a.roomType}</Badge>
                {a.isDemo && <Badge tone="hot">seeded</Badge>}
                {a.closed && <Badge tone="neutral">closed</Badge>}
              </div>

              <span className="text-[10px] text-muted-foreground font-sans">
                {a.realVotes} real pledge{a.realVotes === 1 ? "" : "s"} from {a.backers} backer
                {a.backers === 1 ? "" : "s"}
                {seeded > 0 ? ` · ${money(seeded)} seeded` : ""}
                {showAge ? ` · ${formatSince(a.createdAt)}` : ""}
              </span>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <span className="flex flex-col items-end">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Real
                </span>
                <span
                  className={`text-sm font-extrabold tabular-nums ${
                    a.realRevenue > 0 ? "text-emerald-500" : "text-muted-foreground"
                  }`}
                >
                  {money(a.realRevenue)}
                </span>
              </span>

              <span className="flex flex-col items-end">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Shown
                </span>
                <span className="text-sm font-bold text-foreground/70 tabular-nums">
                  {money(a.displayedPool)}
                </span>
              </span>

              <Link
                href={`/${a.roomType === "global" ? "global" : "battle"}/${a.id}`}
                target="_blank"
                aria-label={`Open ${a.title}`}
                className="rounded-lg border border-border/60 bg-muted/40 p-1.5 text-muted-foreground
                           hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
