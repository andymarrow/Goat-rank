"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame, Gift, Lock, Check, Trophy, Sparkles, ArrowRight, Coins, Clock,
} from "lucide-react";

import LevelBadge from "@/components/ui/LevelBadge";
import { TIER_COLOUR, tierOf, pointsForLevel } from "@/lib/levels";
import { formatSince } from "@/lib/time";
import {
  buyReward, type Achievement, type LevelReward, type PointEntry, type RewardItem,
  type RewardProfile,
} from "@/actions/rewards";

const num = (n: number) => Math.round(n).toLocaleString("en-US");

const TIER_RING: Record<string, string> = {
  bronze: "border-amber-700/40 bg-amber-700/5",
  silver: "border-slate-400/40 bg-slate-400/5",
  gold: "border-amber-400/50 bg-amber-400/5",
  legend: "border-primary/50 bg-primary/10",
};

/**
 * The rewards page.
 *
 * Ordered by what someone came for: what have I got, what can I spend it on,
 * what am I chasing, and only then the history. A signed-out visitor sees the
 * same ladder with nothing filled in, because seeing what is worth chasing is
 * half the reason to make an account.
 */
export default function RewardsBoard({
  profile,
  achievements,
  items,
  levels,
  history,
}: {
  profile: RewardProfile | null;
  achievements: Achievement[];
  items: RewardItem[];
  levels: LevelReward[];
  history: PointEntry[];
}) {
  const [points, setPoints] = useState(profile?.points ?? 0);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const colour = profile ? TIER_COLOUR[tierOf(profile.level)] : TIER_COLOUR.rookie;

  const buy = (item: RewardItem) =>
    startTransition(async () => {
      setError(null);
      setNote(null);

      const res = await buyReward(item.id);

      if (!res.ok) {
        setError(res.error ?? "Could not complete that.");
        return;
      }

      setPoints(res.points ?? points - item.cost);
      setNote(`${item.name} is yours. ${item.grantAmount} added to your account.`);
    });

  return (
    <div className="w-full flex flex-col gap-6 py-6 md:py-10 pb-24">
      {/* -------------------------------------------------------- STANDING */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(120% 90% at 85% 0%, ${colour}26 0%, transparent 65%)` }}
        />

        <div className="relative p-5 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Your standing
              </span>

              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-foreground tabular-nums">
                  {num(points)}
                </span>
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  GOAT points
                </span>
              </div>

              {profile && (
                <p className="text-xs text-muted-foreground font-sans mt-1">
                  {num(profile.lifetime)} earned all-time. Spending never costs you a level.
                </p>
              )}
            </div>

            {profile ? (
              <div className="flex flex-col items-end gap-2">
                <LevelBadge level={profile.level} />

                {profile.streak > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40
                                   bg-orange-500/10 px-2.5 py-1 font-mono text-[10px] font-bold
                                   uppercase tracking-wider text-orange-500">
                    <Flame className="w-3 h-3" /> {profile.streak} day streak
                  </span>
                )}
              </div>
            ) : (
              <Link
                href="/login?next=/rewards"
                className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-bold
                           uppercase tracking-wider hover:opacity-95 transition-opacity"
              >
                Sign in to start earning
              </Link>
            )}
          </div>

          {/* Level progress */}
          {profile && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-foreground">Level {profile.level}</span>
                <span className="text-muted-foreground tabular-nums">
                  {profile.progress.nextLevel
                    ? `${num(profile.progress.toNext)} to level ${profile.progress.nextLevel}`
                    : "Maximum level"}
                </span>
              </div>

              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${colour}, ${colour}99)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, profile.progress.fraction * 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          )}

          {/* What they hold */}
          {profile && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: "Arenas to host", value: profile.roomCredits },
                { label: "Contender slots", value: profile.contenderCredits },
                { label: "Bonus free picks", value: profile.bonusFreePicks },
                { label: "Badges", value: `${unlocked}/${achievements.length}` },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-border/60 bg-background/60 px-3 py-2.5"
                >
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </span>
                  <span className="block text-lg font-extrabold text-foreground tabular-nums">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------- STORE */}
      <section className="flex flex-col gap-3">
        <header className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">Spend your points</h2>
        </header>

        {note && (
          <p role="status" className="text-[11px] text-emerald-500 font-sans">{note}</p>
        )}
        {error && (
          <p role="alert" className="text-[11px] text-red-500 font-sans">{error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {items.map((item) => {
            const can = profile && points >= item.cost;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 flex flex-col gap-3 transition-colors ${
                  can ? "border-border/70 bg-card" : "border-border/50 bg-card/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-xl bg-primary/10 border border-primary/30 p-2 text-primary">
                    <Coins className="w-4 h-4" />
                  </span>
                  <span className="font-mono text-sm font-extrabold text-foreground tabular-nums">
                    {num(item.cost)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block font-bold text-sm text-foreground">{item.name}</span>
                  <span className="block text-[11px] text-muted-foreground font-sans leading-relaxed mt-0.5">
                    {item.description}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={!can || pending}
                  onClick={() => buy(item)}
                  className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 font-bold
                             text-xs uppercase tracking-wider hover:opacity-95 transition-all
                             cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {!profile
                    ? "Sign in"
                    : can
                    ? "Redeem"
                    : `${num(item.cost - points)} more`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------ ACHIEVEMENTS */}
      <section className="flex flex-col gap-3">
        <header className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">Achievements</h2>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
            {unlocked} of {achievements.length}
          </span>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {achievements.map((a) => (
            <div
              key={a.slug}
              className={`rounded-2xl border p-4 flex items-start gap-3 transition-colors ${
                a.unlocked ? TIER_RING[a.tier] ?? TIER_RING.bronze : "border-border/50 bg-card/40"
              }`}
            >
              <span
                className={`shrink-0 rounded-xl p-2 ${
                  a.unlocked ? "bg-background/60 text-foreground" : "bg-muted/40 text-muted-foreground/60"
                }`}
              >
                {a.unlocked ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold text-sm truncate ${
                      a.unlocked ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {a.name}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-primary">
                    +{a.points}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground font-sans leading-relaxed mt-0.5">
                  {a.description}
                </p>

                {!a.unlocked && a.progress > 0 && (
                  <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${Math.max(3, a.progress * 100)}%` }}
                    />
                  </div>
                )}

                {a.unlocked && a.unlockedAt && (
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70 mt-1.5">
                    {formatSince(a.unlockedAt)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ LEVEL LADDER */}
      <section className="flex flex-col gap-3">
        <header className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">The ladder</h2>
        </header>

        <div className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
          {levels.map((l) => (
            <div
              key={l.level}
              className={`flex items-center gap-3 p-3.5 ${l.reached ? "" : "opacity-70"}`}
            >
              <LevelBadge level={l.level} variant="dot" className="shrink-0" />

              <div className="min-w-0 flex-1">
                <span className="block font-bold text-sm text-foreground">
                  Level {l.level}: {l.title}
                </span>
                <span className="block text-[11px] text-muted-foreground font-sans">
                  {[
                    l.roomCredits > 0 && `${l.roomCredits} arenas`,
                    l.contenderCredits > 0 && `${l.contenderCredits} contender slots`,
                    l.freePicks > 0 && `${l.freePicks} free picks`,
                    l.points > 0 && `${num(l.points)} points`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>

              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider tabular-nums text-muted-foreground">
                {l.reached ? (
                  <span className="text-emerald-500 inline-flex items-center gap-1">
                    <Check className="w-3 h-3" /> reached
                  </span>
                ) : (
                  `${num(pointsForLevel(l.level))} pts`
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- HISTORY */}
      {history.length > 0 && (
        <section className="flex flex-col gap-3">
          <header className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-lg font-bold tracking-tight text-foreground">Recent points</h2>
          </header>

          <ul className="rounded-2xl border border-border/70 bg-card divide-y divide-border/50">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-foreground truncate">
                    {h.reason ?? h.kind}
                  </span>
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {formatSince(h.createdAt)}
                  </span>
                </span>

                <span
                  className={`shrink-0 text-sm font-extrabold tabular-nums ${
                    h.points >= 0 ? "text-emerald-500" : "text-muted-foreground"
                  }`}
                >
                  {h.points >= 0 ? "+" : ""}
                  {num(h.points)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href="/"
        className="self-center inline-flex items-center gap-1.5 font-mono text-[10px] uppercase
                   tracking-wider text-muted-foreground hover:text-primary transition-colors"
      >
        Go earn some <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
