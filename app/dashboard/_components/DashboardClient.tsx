"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Wallet, Swords, Clock, TrendingUp, History, Download, Loader2, ArrowUpRight, ImageOff } from "lucide-react";
import ProfileEditor from "./ProfileEditor";
import type { AvatarOption } from "@/actions/profile";
import { formatCountdown, formatSince, formatAbsolute } from "@/lib/time";

import type { DashboardData } from "@/actions/getDashboard";
import { requestPayout } from "@/actions/requestPayout";
import { MIN_PAYOUT_USD } from "@/lib/constants";

const money = (n: number) =>
  `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DashboardClient({
  data,
  avatars,
}: {
  data: DashboardData;
  avatars: AvatarOption[];
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [payoutState, setPayoutState] = useState<{ ok?: boolean; error?: string }>({});
  const [pending, startTransition] = useTransition();

  const canWithdraw =
    data.walletBalance >= MIN_PAYOUT_USD && data.pendingPayout === 0 && !data.isBanned;

  const submitPayout = () =>
    startTransition(async () => setPayoutState(await requestPayout()));

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12 font-sans">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-2xl bg-zinc-900 border-2 border-border/80 p-1 shadow-xl relative overflow-hidden">
            <Image src={data.avatar} alt={data.name} width={96} height={96} className="w-full h-full object-cover rounded-xl" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-1">COMMAND CENTER</span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground uppercase tracking-tight truncate">
              {data.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ProfileEditor
            currentName={data.name}
            currentAvatar={data.avatar}
            avatars={avatars}
          />
          <Link
            href="/create"
            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Swords className="w-4 h-4" />
            <span>DEPLOY NEW BATTLE</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* =========================================
            LEFT COLUMN: THE WALLET & STATS
        ============================================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Main Wallet Card */}
          <div className="rounded-3xl bg-card border border-border/80 p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/15 transition-colors duration-700" />

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <Wallet className="w-4 h-4 text-primary" />
                <span>AVAILABLE BALANCE</span>
              </div>
            </div>

            <div className="mb-6 relative z-10">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight break-all tabular-nums">
                {money(data.walletBalance)}
              </div>
              <span className="text-xs text-muted-foreground font-sans mt-2 block">
                Total lifetime earned: <strong className="text-foreground font-semibold">{money(data.totalEarned)}</strong>
              </span>
            </div>

            <button
              onClick={submitPayout}
              disabled={!canWithdraw || pending}
              className="w-full rounded-xl border border-primary/80 bg-primary/10 hover:bg-primary
                         text-primary hover:text-primary-foreground py-3.5 font-bold
                         text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2
                         transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-40
                         disabled:cursor-not-allowed disabled:hover:bg-primary/10 disabled:hover:text-primary"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{data.pendingPayout > 0 ? "PAYOUT QUEUED" : "REQUEST PAYOUT"}</span>
            </button>

            {data.pendingPayout > 0 && (
              <p className="relative z-10 mt-2 text-xs text-muted-foreground font-sans text-center">
                {money(data.pendingPayout)} awaiting review.
              </p>
            )}

            {!canWithdraw && data.pendingPayout === 0 && !data.isBanned && (
              <p className="relative z-10 mt-2 text-xs text-muted-foreground font-sans text-center">
                Minimum withdrawal is ${MIN_PAYOUT_USD}.
              </p>
            )}

            {payoutState.error && (
              <p role="alert" className="relative z-10 mt-2 text-xs text-destructive font-sans font-semibold text-center">
                {payoutState.error}
              </p>
            )}
            {payoutState.ok && (
              <p role="status" className="relative z-10 mt-2 text-xs text-emerald-400 font-sans font-semibold text-center">
                Payout queued — we&apos;ll email you when it&apos;s sent.
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">COMMISSION</span>
              <span className="text-xl font-extrabold text-foreground tabular-nums">10%</span>
            </div>
            <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm">
              <Swords className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">DEPLOYS LEFT</span>
              <span className="text-xl font-extrabold text-foreground tabular-nums">
                {data.roomCredits}
                <span className="text-muted-foreground text-sm font-semibold"> / 5</span>
              </span>
              <span className="text-[11px] text-muted-foreground leading-snug">
                {data.roomCredits > 0
                  ? "Free with your pass"
                  : "Next deploy costs $10 (buys 5)"}
              </span>
            </div>
          </div>

        </div>


        {/* =========================================
            RIGHT COLUMN: BATTLES & LEDGER
        ============================================= */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Custom Tabs */}
          <div className="flex border-b border-border/60 gap-2 mb-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-5 py-3 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all border-b-2 cursor-pointer ${activeTab === "overview"
                ? "text-primary border-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
            >
              MY ARENAS
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-5 py-3 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all border-b-2 cursor-pointer ${activeTab === "ledger"
                ? "text-primary border-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
            >
              EARNINGS HISTORY
            </button>
          </div>

          {/* TAB 1: My Battles */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-4">
              {data.battles.map((battle) => (
                <Link
                  key={battle.id}
                  href={`/${battle.room_type === "global" ? "global" : "battle"}/${battle.id}`}
                  className="rounded-2xl bg-card border border-border/80 p-5
                             flex flex-col md:flex-row md:items-center justify-between gap-4
                             hover:border-primary/50 transition-all shadow-sm group"
                >
                  <div className="relative flex items-center gap-4 min-w-0">
                    {/* Contender art — overlapped */}
                    <div className="flex shrink-0">
                      {battle.contenders.length === 0 ? (
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-border/80 flex items-center justify-center text-muted-foreground">
                          <ImageOff className="w-4 h-4" />
                        </div>
                      ) : (
                        battle.contenders.map((c, i) => (
                          <div
                            key={i}
                            className="relative w-12 h-12 rounded-full bg-zinc-900 border-2 border-card overflow-hidden shadow-xs"
                            style={{ marginLeft: i === 0 ? 0 : -14, zIndex: 10 - i }}
                          >
                            {c.image_url ? (
                              <Image src={c.image_url} alt={c.name} fill sizes="48px" className="object-cover" />
                            ) : (
                              <span
                                className="w-full h-full flex items-center justify-center font-extrabold text-xs"
                                style={{ backgroundColor: c.brand_color ?? "#333", color: "#fff" }}
                              >
                                {c.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {battle.status === "active" ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/80 text-[10px] font-bold text-primary shadow-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span>LIVE</span>
                          </div>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {battle.status.replace("_", " ")}
                            </span>
                          </>
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          • {battle.room_type === "global" ? "Global" : "1v1"}
                        </span>
                      </div>
                      <span className="text-lg sm:text-xl font-extrabold text-foreground group-hover:text-primary transition-colors truncate">
                        {battle.title}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-8 bg-zinc-900/60 border border-border/60 rounded-xl p-3 md:p-4 shrink-0">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">TOTAL POOL</span>
                      <span className="text-sm font-extrabold text-foreground tabular-nums">{money(battle.total_pool)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">YOU EARNED (10%)</span>
                      <span className="text-sm font-extrabold text-primary tabular-nums">{money(battle.my_cut)}</span>
                    </div>
                    <div className="hidden md:flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> CLOSES IN
                      </span>
                      <span
                        className="text-xs font-bold text-foreground tabular-nums"
                        title={formatAbsolute(battle.expires_at)}
                      >
                        {formatCountdown(battle.expires_at)}
                      </span>
                    </div>
                    <ArrowUpRight className="hidden md:block w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* TAB 2: Financial Ledger */}
          {activeTab === "ledger" && (
            <div className="rounded-2xl bg-card border border-border/80 overflow-hidden flex flex-col shadow-sm">
              <div className="bg-zinc-900/60 border-b border-border/60 p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <History className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">WHERE YOUR MONEY CAME FROM</span>
                  <span className="text-[11px] text-muted-foreground font-sans mt-0.5">
                    Your 10% commission on every vote, plus withdrawals. Tap a row to open the arena.
                  </span>
                </div>
              </div>

              <div className="flex flex-col">
                {data.ledger.map((tx, index) => {
                  const border = index !== data.ledger.length - 1 ? "border-b border-border/60" : "";
                  const body = (
                    <>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-sm text-foreground font-semibold truncate">
                          {tx.type === "commission" ? `Your 10% from ${tx.label}` : tx.label}
                        </span>
                        <span
                          className="text-[11px] font-semibold text-muted-foreground"
                          title={formatAbsolute(tx.created_at)}
                        >
                          {formatSince(tx.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-extrabold tabular-nums ${tx.amount >= 0 ? "text-emerald-400" : "text-foreground"}`}>
                          {tx.amount >= 0 ? "+" : "-"}{money(Math.abs(tx.amount))}
                        </span>
                        {tx.room_id && (
                          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                      </div>
                    </>
                  );

                  return tx.room_id ? (
                    <Link
                      key={tx.id}
                      href={`/${tx.room_type === "global" ? "global" : "battle"}/${tx.room_id}`}
                      className={`group flex items-center justify-between gap-3 p-4 hover:bg-muted/40 transition-colors ${border}`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div key={tx.id} className={`flex items-center justify-between gap-3 p-4 ${border}`}>
                      {body}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}