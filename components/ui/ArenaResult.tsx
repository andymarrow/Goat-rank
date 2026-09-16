"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, HeartHandshake, Lock, Share2, Swords, Check } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import type { Beneficiary } from "@/components/ui/CharityCard";
import { finalStanding, isDraw, shareOf, type Standing } from "@/lib/arena";
import { settleRoomIfDue } from "@/actions/settleArena";
import { formatAbsolute } from "@/lib/time";

const money = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

/**
 * What an arena looks like once it is over.
 *
 * A closed contest is not a broken live one, so this replaces the stage rather
 * than greying it out: the result is the content now. It leads with the
 * outcome, states the money that settled it, and names the charity the 30%
 * went to, because that is the part a backer actually wants confirmed.
 *
 * Everything below it stays readable. You can still open the arena, read the
 * battle cries and visit a contender; you simply cannot pledge, and the page
 * says so once instead of leaving dead buttons around.
 */
export default function ArenaResult({
  roomId,
  roomType,
  title,
  contenders,
  totalPool,
  expiresAt,
  charity,
  status,
}: {
  roomId: string;
  roomType: "1v1" | "global";
  title: string;
  contenders: Standing[];
  totalPool: number;
  expiresAt: string;
  charity?: Beneficiary | null;
  status: string;
}) {
  const [copied, setCopied] = useState(false);

  // Nothing settles an arena on a schedule, so the first visitor after the
  // deadline is what finalises it. Idempotent, and deliberately not awaited
  // into the render: the page is already showing the right result.
  useEffect(() => {
    if (status !== "settled") settleRoomIfDue(roomId);
  }, [roomId, status]);

  const ranked = finalStanding(contenders);
  const drawn = isDraw(ranked);
  const champion = ranked[0];
  const pool = totalPool || ranked.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const charityCut = pool * 0.3;

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = drawn
      ? `${title} ended in a dead heat on GOAT Rank.`
      : `${champion?.name} took ${title} on GOAT Rank with ${money(champion?.amount ?? 0)} behind them.`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Cancelled the share sheet, or denied clipboard. Nothing to report.
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-label="Final result"
      className="w-full rounded-3xl border border-border/80 bg-card shadow-xl overflow-hidden"
    >
      {/* Closed strip */}
      <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-2.5 border-b border-border/60 bg-muted/40">
        <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Arena closed
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          {formatAbsolute(expiresAt)}
        </span>

        <button
          type="button"
          onClick={share}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border/60
                     bg-background px-2.5 py-1 font-mono text-[10px] font-bold uppercase
                     tracking-wider text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
          {copied ? "Copied" : "Share result"}
        </button>
      </div>

      <div className="p-5 sm:p-8 flex flex-col gap-6">
        {/* Outcome */}
        <div className="flex flex-col items-center text-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {drawn ? "Dead heat" : pool > 0 ? "Winner" : "No pledges"}
          </span>

          {champion && (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar
                  src={champion.image}
                  name={champion.name}
                  size={112}
                  color={champion.color}
                  className="!w-24 !h-24 sm:!w-28 sm:!h-28 !rounded-3xl shadow-lg"
                />

                {!drawn && pool > 0 && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400
                               text-black p-1.5 shadow-md"
                    aria-hidden="true"
                  >
                    <Crown className="w-4 h-4" />
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {drawn ? "Nobody blinked" : champion.name}
              </h2>

              {pool > 0 && !drawn && (
                <p className="text-sm text-muted-foreground font-sans">
                  Took it with{" "}
                  <strong className="text-foreground">{money(champion.amount)}</strong> behind them,{" "}
                  {shareOf(champion.amount, pool)}% of a {money(pool)} pool.
                </p>
              )}

              {drawn && (
                <p className="text-sm text-muted-foreground font-sans">
                  {ranked[0].name} and {ranked[1].name} finished level on {money(ranked[0].amount)}.
                </p>
              )}

              {pool === 0 && (
                <p className="text-sm text-muted-foreground font-sans">
                  This one closed without a single pledge. The argument goes unsettled.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Final standing */}
        {ranked.length > 0 && pool > 0 && (
          <ol className="flex flex-col gap-2">
            {ranked.slice(0, roomType === "1v1" ? 2 : 8).map((c, i) => {
              const pct = shareOf(c.amount, pool);
              const won = i === 0 && !drawn;

              return (
                <li
                  key={`${c.name}-${i}`}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                    won ? "border-amber-400/50 bg-amber-400/5" : "border-border/60 bg-muted/20"
                  }`}
                >
                  <span
                    className={`w-6 shrink-0 text-center font-extrabold tabular-nums ${
                      won ? "text-amber-500" : "text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>

                  <Avatar
                    src={c.image}
                    name={c.name}
                    size={36}
                    color={c.color}
                    className="!rounded-xl"
                  />

                  <div className="min-w-0 flex-1">
                    {c.entityId ? (
                      <Link
                        href={`/profile/${c.entityId}`}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate block"
                      >
                        {c.name}
                      </Link>
                    ) : (
                      <span className="font-bold text-sm text-foreground truncate block">
                        {c.name}
                      </span>
                    )}

                    <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          backgroundColor: c.color ?? (won ? "#F59E0B" : "#FF7A00"),
                        }}
                      />
                    </div>
                  </div>

                  <span className="shrink-0 flex flex-col items-end">
                    <span className="text-sm font-extrabold text-foreground tabular-nums">
                      {money(c.amount)}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                      {pct}%
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {/* Where the money went */}
        {pool > 0 && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3">
            <span className="shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2 text-emerald-500">
              <HeartHandshake className="w-4 h-4" />
            </span>

            <div className="min-w-0 flex-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
                30% of this pool goes to
              </span>
              <span className="font-bold text-sm text-foreground truncate block">
                {charity?.name ?? "the leading nominated charity"}
              </span>
            </div>

            <span className="shrink-0 text-lg font-extrabold text-emerald-500 tabular-nums">
              {money(charityCut)}
            </span>
          </div>
        )}

        {/* What next */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link
            href={`/create?title=${encodeURIComponent(`${title} (rematch)`)}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary
                       text-primary-foreground py-3 font-bold text-xs uppercase tracking-wider
                       hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Swords className="w-4 h-4" /> Run it back
          </Link>

          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border
                       border-border/60 bg-muted/30 py-3 font-bold text-xs uppercase tracking-wider
                       text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Find a live arena
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
