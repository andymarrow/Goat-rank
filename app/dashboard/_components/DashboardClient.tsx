"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Wallet, Swords, Clock, TrendingUp, History, Download, Loader2 } from "lucide-react";

import type { DashboardData } from "@/actions/getDashboard";
import { requestPayout } from "@/actions/requestPayout";
import { MIN_PAYOUT_USD } from "@/lib/constants";

const money = (n: number) =>
  `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const timeLeft = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "ENDED";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours}h ${Math.floor((ms % 3_600_000) / 60_000)}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

const since = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function DashboardClient({ data }: { data: DashboardData }) {
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

        <Link href="/create" className="cut-corner bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 font-arcade font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,122,0,0.3)]">
          <Swords className="w-4 h-4" /> DEPLOY NEW BATTLE
        </Link>
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
              <span className="font-arcade text-[10px] text-foreground/50 tracking-widest">ACTIVE ROOMS</span>
              <span className="font-arcade text-xl font-bold text-foreground">{data.activeBattles}</span>
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
              MY BATTLES
            </button>
            <button 
              onClick={() => setActiveTab("ledger")}
              className={`px-6 py-3 font-arcade text-sm font-bold transition-colors ${activeTab === "ledger" ? "text-primary border-b-2 border-primary" : "text-foreground/50 hover:text-foreground"}`}
            >
              FINANCIAL LEDGER
            </button>
          </div>

          {/* TAB 1: My Battles */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-4">
              {data.battles.map((battle) => (
                <div key={battle.id} className="bg-card border border-border cut-corner p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${battle.status === "active" ? "bg-battle-green animate-pulse" : "bg-foreground/20"}`} />
                      <span className="font-arcade text-[10px] text-foreground/50 uppercase">{battle.status}</span>
                    </div>
                    <Link href={`/battle/${battle.id}`} className="font-arcade text-xl font-bold text-foreground hover:text-primary transition-colors">
                      {battle.title}
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:flex items-center gap-6 md:gap-12 bg-background border border-border cut-corner p-3 md:p-4">
                    <div className="flex flex-col">
                      <span className="font-arcade text-[10px] text-foreground/40 mb-1">TOTAL POOL</span>
                      <span className="font-arcade text-foreground font-bold">{money(battle.total_pool)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-arcade text-[10px] text-primary mb-1">YOUR CUT (10%)</span>
                      <span className="font-arcade text-primary font-bold">{money(battle.my_cut)}</span>
                    </div>
                    <div className="flex flex-col hidden md:flex">
                      <span className="font-arcade text-[10px] text-foreground/40 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> TIME</span>
                      <span className="font-arcade text-foreground font-bold">{timeLeft(battle.expires_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Financial Ledger */}
          {activeTab === "ledger" && (
            <div className="bg-card border border-border cut-corner overflow-hidden flex flex-col">
              <div className="bg-background border-b border-border p-4 flex items-center gap-2">
                <History className="w-4 h-4 text-foreground/50" />
                <span className="font-arcade text-xs text-foreground/50 tracking-widest">TRANSACTION HISTORY</span>
              </div>
              
              <div className="flex flex-col">
                {data.ledger.map((tx, index) => (
                  <div key={tx.id} className={`flex items-center justify-between p-4 ${index !== data.ledger.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-sm text-foreground font-medium">{tx.label}</span>
                      <span className="font-arcade text-[10px] text-foreground/40">{since(tx.created_at)}</span>
                    </div>
                    
                    <div className={`font-arcade font-bold ${tx.amount >= 0 ? 'text-battle-green' : 'text-foreground'}`}>
                      {tx.amount >= 0 ? "+" : "-"}{money(Math.abs(tx.amount))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}