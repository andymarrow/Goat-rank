"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Timer, Flame, Trophy, Search, UserPlus, TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { motion } from "framer-motion";
import AddContenderModal from "./AddContenderModal";

// Mock Data
const MOCK_ROOM = {
  id: "g1",
  title: "The Soccer GOAT",
  category: "Sports",
  pool: "$240,500",
  timeLeft: "48:12:00",
  charity: "FIFA Foundation",
  image: "https://images.unsplash.com/photo-1518605368461-1ee7e1634b6e?w=1600&q=80",
};

const MOCK_RANKINGS = [
  { id: "e1", rank: 1, name: "Lionel Messi", amount: 120000, img: "/image/messi.png", color: "#3B82F6", trend: "up" },
  { id: "e2", rank: 2, name: "Cristiano Ronaldo", amount: 95500, img: "/image/ronaldo.png", color: "#FF7A00", trend: "down" },
  { id: "e3", rank: 3, name: "Pelé", amount: 15000, img: "https://images.unsplash.com/photo-1574629810360-7efbb6b0807e?w=400", color: "#00E676", trend: "same" },
  { id: "e4", rank: 4, name: "Diego Maradona", amount: 8500, img: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400", color: "#3B82F6", trend: "up" },
  { id: "e5", rank: 5, name: "Zinedine Zidane", amount: 1500, img: "https://images.unsplash.com/photo-1518605368461-1ee7e1634b6e?w=400", color: "#3B82F6", trend: "down" },
  { id: "e6", rank: 6, name: "Johan Cruyff", amount: 900, img: "https://images.unsplash.com/photo-1518605368461-1ee7e1634b6e?w=400", color: "#FF7A00", trend: "same" },
];

export default function GlobalRoomClient({ slug }: { slug: string }) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRankings = MOCK_RANKINGS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const topThree = filteredRankings.slice(0, 3);
  const theRest = filteredRankings.slice(3);

  // Helper for trend icons
  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-battle-green" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-battle-red" />;
    return <Minus className="w-4 h-4 text-foreground/30" />;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 lg:p-12">
      
      {/* Top Nav */}
      <Link href="/" className="inline-flex items-center gap-2 text-foreground/50 hover:text-primary font-arcade text-xs transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> RETURN TO ARENA
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* =========================================
            LEFT COLUMN: STICKY COMMAND CENTER
        ============================================= */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-6">
          
          {/* Room Identity Card */}
          <div className="bg-card border border-border cut-corner-lg overflow-hidden flex flex-col shadow-xl">
            {/* Image Banner */}
            <div className="relative w-full h-48 bg-black">
              <Image src={MOCK_ROOM.image} alt={MOCK_ROOM.title} fill className="object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              <div className="absolute top-4 right-4 cut-corner px-3 py-1 bg-primary text-primary-foreground font-arcade text-[10px] font-bold">
                {MOCK_ROOM.category}
              </div>
            </div>
            
            {/* Details */}
            <div className="p-6 -mt-8 relative z-10">
              <h1 className="text-3xl md:text-4xl font-arcade font-black text-foreground uppercase tracking-wider mb-4 leading-none">
                {MOCK_ROOM.title}
              </h1>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-background border border-border cut-corner">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-battle-yellow" />
                    <span className="font-arcade text-foreground/50 text-xs">TOTAL POOL</span>
                  </div>
                  <span className="text-xl font-arcade font-bold text-battle-yellow">{MOCK_ROOM.pool}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-background border border-border cut-corner">
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary" />
                    <span className="font-arcade text-foreground/50 text-xs">TIME LEFT</span>
                  </div>
                  <span className="text-lg font-arcade font-bold text-foreground">{MOCK_ROOM.timeLeft}</span>
                </div>
              </div>
              
              <p className="mt-6 text-xs text-foreground/50 font-sans border-l-2 border-battle-pink pl-3">
                30% of total pool proceeds will be donated to <strong className="text-foreground">{MOCK_ROOM.charity}</strong>.
              </p>
            </div>
          </div>

          {/* Action Panel */}
          <div className="bg-card border border-border cut-corner p-6 flex flex-col gap-4 shadow-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
              <input 
                type="text" 
                placeholder="Search contenders..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border cut-corner pl-10 pr-4 py-3 text-foreground font-sans text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            
            <button 
  onClick={() => setIsModalOpen(true)} // <-- Add this
  className="w-full cut-corner border border-primary/50 hover:bg-primary hover:text-primary-foreground px-6 py-3 flex items-center justify-center gap-2 text-primary font-arcade text-xs transition-all group shadow-[0_0_15px_rgba(255,122,0,0.1)]"
>
  <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
  ADD MISSING CONTENDER ($5)
</button>
          </div>

        </div>


        {/* =========================================
            RIGHT COLUMN: THE LEADERBOARD
        ============================================= */}
        <div className="lg:col-span-8 flex flex-col gap-8 pb-24">
          
          {/* --- THE VANGUARD (TOP 3 PODIUM) --- */}
          {topThree.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Flame className="w-5 h-5 text-primary" />
                <h3 className="font-arcade text-foreground/50 tracking-widest text-sm">THE VANGUARD</h3>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topThree.map((entity, index) => {
                  const isFirst = index === 0;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                      key={entity.id} 
                      className={`relative flex flex-col bg-card border cut-corner p-5 group overflow-hidden ${
                        isFirst ? "border-battle-yellow shadow-[0_0_30px_rgba(255,214,0,0.15)]" : "border-border hover:border-primary/50"
                      }`}
                    >
                      {/* Rank Number Background Watermark */}
                      <div className={`absolute -right-4 -bottom-8 font-arcade font-black text-9xl opacity-5 select-none ${isFirst ? 'text-battle-yellow opacity-10' : 'text-foreground'}`}>
                        {entity.rank}
                      </div>

                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <span className={`text-3xl font-arcade font-black ${isFirst ? 'striped-text' : 'text-foreground/30'}`}>
                          #{entity.rank}
                        </span>
                        {getTrendIcon(entity.trend)}
                      </div>

                      <div className="flex flex-col items-center text-center relative z-10 mb-6">
                        <div className="w-24 h-24 cut-corner overflow-hidden bg-background mb-4 border-b-4" style={{ borderColor: entity.color }}>
                          <Image src={entity.img} alt={entity.name} width={96} height={96} className="object-cover w-full h-full group-hover:scale-110 transition-transform" />
                        </div>
                        <h4 className="font-arcade font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors cursor-pointer">
                          <Link href={`/profile/${entity.id}`}>{entity.name}</Link>
                        </h4>
                        <span className={`font-arcade font-bold ${isFirst ? 'text-battle-yellow text-xl' : 'text-foreground text-lg'}`}>
                          ${entity.amount.toLocaleString()}
                        </span>
                      </div>

                      <button className="w-full cut-corner py-3 font-arcade font-bold text-xs transition-all hover:brightness-110 relative z-10" style={{ backgroundColor: entity.color, color: "#000" }}>
                        BACK CONTENDER
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- THE CHASERS (RANK 4+) --- */}
          {theRest.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-5 h-5 text-foreground/40" />
                <h3 className="font-arcade text-foreground/50 tracking-widest text-sm">THE CHASERS</h3>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="flex flex-col gap-2">
                {theRest.map((entity, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                    key={entity.id}
                    className="flex items-center p-3 bg-card border border-border cut-corner hover:border-primary/50 transition-all group"
                  >
                    <div className="w-12 text-center font-arcade font-bold text-foreground/30 text-lg">
                      #{entity.rank}
                    </div>
                    
                    <Link href={`/profile/${entity.id}`} className="flex-1 flex items-center gap-4 cursor-pointer px-4 border-l border-border">
                      <div className="w-10 h-10 cut-corner overflow-hidden bg-background border-b-2" style={{ borderColor: entity.color }}>
                        <Image src={entity.img} alt={entity.name} width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                      <span className="font-arcade font-bold text-foreground group-hover:text-primary transition-colors md:text-lg">
                        {entity.name}
                      </span>
                    </Link>

                    <div className="flex items-center gap-6 pr-4">
                      <div className="hidden md:flex flex-col items-end">
                        <span className="font-arcade font-bold text-foreground">${entity.amount.toLocaleString()}</span>
                      </div>
                      <div className="w-4 flex justify-center">
                        {getTrendIcon(entity.trend)}
                      </div>
                      <button className="hidden md:block cut-corner px-6 py-2 font-arcade font-bold text-xs transition-all hover:brightness-110" style={{ backgroundColor: entity.color, color: "#000" }}>
                        VOTE
                      </button>
                      <button className="md:hidden cut-corner p-2 font-arcade font-bold text-xs transition-all hover:brightness-110" style={{ backgroundColor: entity.color, color: "#000" }}>
                        +
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {filteredRankings.length === 0 && (
  <div className="text-center py-16 bg-card border border-border cut-corner">
    <p className="text-foreground/40 font-arcade text-sm mb-4">NO CONTENDER FOUND.</p>
    <button 
      onClick={() => setIsModalOpen(true)} // <-- Add this
      className="cut-corner border border-primary text-primary px-6 py-2 font-arcade text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
    >
      ADD THEM TO THE ARENA ($5)
    </button>
  </div>
)}

        </div>

      </div>

      <AddContenderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        roomTitle={MOCK_ROOM.title} 
      />
      
    </div>
  );
}