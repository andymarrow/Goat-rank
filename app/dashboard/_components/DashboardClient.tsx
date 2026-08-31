"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet, ArrowUpRight, Swords, Clock, TrendingUp, History, Download } from "lucide-react";
import Image from "next/image";

// Mock Data for the logged-in User
const MOCK_USER = {
  name: "Ridge",
  avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Ridge",
  walletBalance: 124.50,
  totalEarned: 345.00,
  activeBattles: 2,
};

// Mock Data for Battles they created
const MY_BATTLES = [
  { id: "b1", title: "The GOAT Battle", status: "Active", pool: "$22,450", myCut: "$2,245.00", timeLeft: "12:45:00" },
  { id: "g1", title: "Best Code Editor", status: "Active", pool: "$8,200", myCut: "$820.00", timeLeft: "04:12:30" },
  { id: "b3", title: "Next Gen Console", status: "Finished", pool: "$12,100", myCut: "$1,210.00", timeLeft: "ENDED" },
];

// Mock Ledger for Wallet History
const TRANSACTION_HISTORY = [
  { id: "tx1", type: "commission", amount: "+$4.50", from: "The GOAT Battle", date: "2 mins ago" },
  { id: "tx2", type: "commission", amount: "+$1.20", from: "Best Code Editor", date: "15 mins ago" },
  { id: "tx3", type: "withdrawal", amount: "-$100.00", from: "Bank Transfer", date: "1 day ago" },
  { id: "tx4", type: "purchase", amount: "-$10.00", from: "Creator Pass (3 Rooms)", date: "2 days ago" },
];

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 md:w-24 md:h-24 cut-corner bg-background border border-border p-2 shadow-lg">
            <Image src={MOCK_USER.avatar} alt={MOCK_USER.name} width={96} height={96} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-arcade text-xs text-foreground/50 tracking-widest block mb-1">COMMAND CENTER</span>
            <h1 className="text-3xl md:text-5xl font-arcade font-bold text-foreground uppercase tracking-wider">
              {MOCK_USER.name}
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
                ${MOCK_USER.walletBalance.toFixed(2)}
              </div>
              <span className="text-xs text-foreground/40 font-sans mt-2 block">
                Total lifetime earned: <strong className="text-foreground/70">${MOCK_USER.totalEarned.toFixed(2)}</strong>
              </span>
            </div>

            <button className="w-full cut-corner border border-primary text-primary hover:bg-primary hover:text-primary-foreground py-4 font-arcade font-bold text-sm flex items-center justify-center gap-2 transition-colors relative z-10 bg-background">
              <Download className="w-4 h-4" /> REQUEST PAYOUT
            </button>
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
              <span className="font-arcade text-xl font-bold text-foreground">{MOCK_USER.activeBattles} / 3</span>
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
              {MY_BATTLES.map((battle) => (
                <div key={battle.id} className="bg-card border border-border cut-corner p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${battle.status === "Active" ? "bg-battle-green animate-pulse" : "bg-foreground/20"}`} />
                      <span className="font-arcade text-[10px] text-foreground/50 uppercase">{battle.status}</span>
                    </div>
                    <Link href={`/battle/${battle.id}`} className="font-arcade text-xl font-bold text-foreground hover:text-primary transition-colors">
                      {battle.title}
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:flex items-center gap-6 md:gap-12 bg-background border border-border cut-corner p-3 md:p-4">
                    <div className="flex flex-col">
                      <span className="font-arcade text-[10px] text-foreground/40 mb-1">TOTAL POOL</span>
                      <span className="font-arcade text-foreground font-bold">{battle.pool}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-arcade text-[10px] text-primary mb-1">YOUR CUT (10%)</span>
                      <span className="font-arcade text-primary font-bold">{battle.myCut}</span>
                    </div>
                    <div className="flex flex-col hidden md:flex">
                      <span className="font-arcade text-[10px] text-foreground/40 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> TIME</span>
                      <span className="font-arcade text-foreground font-bold">{battle.timeLeft}</span>
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
                {TRANSACTION_HISTORY.map((tx, index) => (
                  <div key={tx.id} className={`flex items-center justify-between p-4 ${index !== TRANSACTION_HISTORY.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-sm text-foreground font-medium">{tx.from}</span>
                      <span className="font-arcade text-[10px] text-foreground/40">{tx.date}</span>
                    </div>
                    
                    <div className={`font-arcade font-bold ${tx.amount.startsWith('+') ? 'text-battle-green' : 'text-foreground'}`}>
                      {tx.amount}
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