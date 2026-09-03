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
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 md:w-24 md:h-24 cut-corner bg-background border border-border p-2 shadow-lg">
            <Image src={data.avatar} alt={data.name} width={96} height={96} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-arcade text-xs text-foreground/50 tracking-widest block mb-1">COMMAND CENTER</span>
            <h1 className="text-3xl md:text-5xl font-arcade font-bold text-foreground uppercase tracking-wider">
              {data.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
        <ProfileEditor
          currentName={data.name}
          currentAvatar={data.avatar}
          avatars={avatars}
        />
        <Link href="/create" className="pressable cut-corner bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 font-arcade font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,122,0,0.3)]">
          <Swords className="w-4 h-4" /> DEPLOY NEW BATTLE
        </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* =========================================
            LEFT COLUMN: THE WALLET & STATS
        ============================================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Main Wallet Card */}
          <div className="bg-card border border-border cut-corner-lg p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-2 text-foreground/50 font-arcade text-xs tracking-widest">
                <Wallet className="w-4 h-4 text-primary" />
                AVAILABLE BALANCE
              </div>
            </div>

            <div className="mb-8 relative z-10">
              <div className="text-5xl md:text-6xl font-arcade font-black text-foreground tracking-wider striped-text">
                {money(data.walletBalance)}
              </div>
              <span className="text-xs text-foreground/40 font-sans mt-2 block">
                Total lifetime earned: <strong className="text-foreground/70">{money(data.totalEarned)}</strong>
              </span>
            </div>

            <button
              onClick={submitPayout}
              disabled={!canWithdraw || pending}
              className="pressable w-full cut-corner border border-primary text-primary
                         hover:bg-primary hover:text-primary-foreground py-4 font-arcade font-bold
                         text-sm flex items-center justify-center gap-2 transition-colors relative
                         z-10 bg-background disabled:opacity-40 disabled:cursor-not-allowed
                         disabled:hover:bg-background disabled:hover:text-primary"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {data.pendingPayout > 0 ? "PAYOUT QUEUED" : "REQUEST PAYOUT"}
            </button>

            {data.pendingPayout > 0 && (
              <p className="relative z-10 mt-2 text-[11px] text-foreground/50 font-sans text-center">
                {money(data.pendingPayout)} awaiting review.
              </p>
            )}

            {!canWithdraw && data.pendingPayout === 0 && !data.isBanned && (
              <p className="relative z-10 mt-2 text-[11px] text-foreground/40 font-sans text-center">
                Minimum withdrawal is ${MIN_PAYOUT_USD}.
              </p>
            )}

            {payoutState.error && (
              <p role="alert" className="relative z-10 mt-2 text-[11px] text-battle-red font-sans text-center">
                {payoutState.error}
              </p>
            )}
            {payoutState.ok && (
              <p role="status" className="relative z-10 mt-2 text-[11px] text-battle-green font-sans text-center">
                Payout queued — we&apos;ll email you when it&apos;s sent.
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border cut-corner p-4 flex flex-col gap-2">
              <TrendingUp className="w-4 h-4 text-battle-green" />
              <span className="font-arcade text-[10px] text-foreground/50 tracking-widest">COMMISSION</span>
              <span className="font-arcade text-xl font-bold text-foreground">10%</span>
            </div>
            <div className="bg-card border border-border cut-corner p-4 flex flex-col gap-2">
              <Swords className="w-4 h-4 text-battle-yellow" />
              <span className="font-arcade text-[10px] text-foreground/50 tracking-widest">DEPLOYS LEFT</span>
              <span className="font-arcade text-xl font-bold text-foreground">
                {data.roomCredits}
                <span className="text-foreground/30 text-sm"> / 5</span>
              </span>
              <span className="text-[10px] text-foreground/40 font-sans leading-snug">
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
          <div className="flex border-b border-border mb-2">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 font-arcade text-sm font-bold transition-colors ${activeTab === "overview" ? "text-primary border-b-2 border-primary" : "text-foreground/50 hover:text-foreground"}`}
            >
              MY ARENAS
            </button>
            <button 
              onClick={() => setActiveTab("ledger")}
              className={`px-6 py-3 font-arcade text-sm font-bold transition-colors ${activeTab === "ledger" ? "text-primary border-b-2 border-primary" : "text-foreground/50 hover:text-foreground"}`}
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
                  className="pressable hover-lift corner-ticks relative bg-card border border-border cut-corner p-5
                             flex flex-col md:flex-row md:items-center justify-between gap-4
                             hover:border-primary/50 transition-colors overflow-hidden group"
                >
                  <div className="tex-dots absolute inset-0 pointer-events-none" />

                  <div className="relative flex items-center gap-4 min-w-0">
                    {/* Contender art — overlapped, so an arena reads as a match-up */}
                    <div className="flex shrink-0">
                      {battle.contenders.length === 0 ? (
                        <div className="w-12 h-12 bg-background border border-border cut-corner flex items-center justify-center text-foreground/20">
                          <ImageOff className="w-4 h-4" />
                        </div>
                      ) : (
                        battle.contenders.map((c, i) => (
                          <div
                            key={i}
                            className="relative w-12 h-12 bg-background border border-border cut-corner overflow-hidden"
                            style={{ marginLeft: i === 0 ? 0 : -14, zIndex: 10 - i }}
                          >
                            {c.image_url ? (
                              <Image src={c.image_url} alt={c.name} fill sizes="48px" className="object-cover" />
                            ) : (
                              <span
                                className="w-full h-full flex items-center justify-center font-arcade text-sm font-bold"
                                style={{ backgroundColor: c.brand_color ?? "#333", color: "#000" }}
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
                        <span className={`w-2 h-2 rounded-full ${battle.status === "active" ? "bg-battle-green animate-pulse" : "bg-foreground/20"}`} />
                        <span className="font-arcade text-[10px] text-foreground/50 uppercase">
                          {battle.status.replace("_", " ")}
                        </span>
                        <span className="font-arcade text-[10px] text-foreground/30 uppercase">
                          {battle.room_type === "global" ? "Global" : "1v1"}
                        </span>
                      </div>
                      <span className="font-arcade text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {battle.title}
                      </span>
                    </div>
                  </div>

                  <div className="relative grid grid-cols-2 md:flex items-center gap-6 md:gap-12 bg-background border border-border cut-corner p-3 md:p-4 shrink-0">
                    <div className="flex flex-col">
                      <span className="font-arcade text-[10px] text-foreground/40 mb-1">TOTAL POOL</span>
                      <span className="font-arcade text-foreground font-bold">{money(battle.total_pool)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-arcade text-[10px] text-primary mb-1">YOU EARNED (10%)</span>
                      <span className="font-arcade text-primary font-bold">{money(battle.my_cut)}</span>
                    </div>
                    <div className="hidden md:flex flex-col">
                      <span className="font-arcade text-[10px] text-foreground/40 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> CLOSES IN
                      </span>
                      <span
                        className="font-arcade text-foreground font-bold tabular-nums"
                        title={formatAbsolute(battle.expires_at)}
                      >
                        {formatCountdown(battle.expires_at)}
                      </span>
                    </div>
                    <ArrowUpRight className="hidden md:block w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* TAB 2: Financial Ledger */}
          {activeTab === "ledger" && (
            <div className="bg-card border border-border cut-corner overflow-hidden flex flex-col">
              <div className="bg-background border-b border-border p-4 flex items-center gap-2">
                <History className="w-4 h-4 text-foreground/50" />
                <div className="flex flex-col">
                  <span className="font-arcade text-xs text-foreground/70 tracking-widest">WHERE YOUR MONEY CAME FROM</span>
                  <span className="text-[11px] text-foreground/40 font-sans mt-0.5">
                    Your 10% commission on every vote, plus withdrawals. Tap a row to open the arena.
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col">
                {data.ledger.map((tx, index) => {
                  const border = index !== data.ledger.length - 1 ? "border-b border-border" : "";
                  const body = (
                    <>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-sans text-sm text-foreground font-medium truncate">
                          {tx.type === "commission" ? `Your 10% from ${tx.label}` : tx.label}
                        </span>
                        <span
                          className="font-arcade text-[10px] text-foreground/40"
                          title={formatAbsolute(tx.created_at)}
                        >
                          {formatSince(tx.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-arcade font-bold ${tx.amount >= 0 ? "text-battle-green" : "text-foreground"}`}>
                          {tx.amount >= 0 ? "+" : "-"}{money(Math.abs(tx.amount))}
                        </span>
                        {tx.room_id && (
                          <ArrowUpRight className="w-3.5 h-3.5 text-foreground/30 group-hover:text-primary transition-colors" />
                        )}
                      </div>
                    </>
                  );

                  // Commission rows link back to the arena that produced them,
                  // so the number can actually be cross-checked.
                  return tx.room_id ? (
                    <Link
                      key={tx.id}
                      href={`/${tx.room_type === "global" ? "global" : "battle"}/${tx.room_id}`}
                      className={`group flex items-center justify-between gap-3 p-4 hover:bg-foreground/[0.03] transition-colors ${border}`}
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