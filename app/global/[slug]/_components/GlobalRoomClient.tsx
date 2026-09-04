"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Timer, Flame, Trophy, Search, UserPlus, TrendingUp, TrendingDown, Minus, Users, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import AddContenderModal from "./AddContenderModal";
import VoteModal from "@/app/battle/[slug]/_components/VoteModal";
import FeedList from "@/components/ui/FeedList";
import Countdown from "@/components/ui/Countdown";

export default function GlobalRoomClient({ initialRoomData }: { initialRoomData: any }) {
  // Initialize with live server data!
  const [roomData, setRoomData] = useState(initialRoomData);
  const [search, setSearch] = useState("");
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [selectedContenderIndex, setSelectedContenderIndex] = useState(0);

  // Filter and slice data for UI
  const filteredRankings = roomData.rankings.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));
  const topThree = filteredRankings.slice(0, 3);
  const theRest = filteredRankings.slice(3);

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-battle-green" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-battle-red" />;
    return <Minus className="w-4 h-4 text-foreground/30" />;
  };

  // Safe handler to find the exact index in the main array even if search is active
  const handleVoteClick = (entityId: string) => {
    const actualIndex = roomData.rankings.findIndex((r: any) => r.id === entityId);
    setSelectedContenderIndex(actualIndex);
    setIsVoteModalOpen(true);
  };

  // Create a synthetic "battle" object to pass to our reusable VoteModal
  const syntheticBattleForModal = {
    id: roomData.id,
    charity: roomData.charity,
    contenders: roomData.rankings.map((r: any) => ({
      id: r.contender_id, 
      name: r.name,
      color: r.color,
      image: r.img
    }))
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
            <div className="relative w-full h-40 sm:h-48 bg-black">
              <Image
                src={roomData.image}
                alt={roomData.leader?.name ?? roomData.title}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              <div className="tex-scanlines absolute inset-0 pointer-events-none" />

              <div className="absolute top-3 right-3 cut-corner px-3 py-1 bg-primary text-primary-foreground font-arcade text-[10px] font-bold">
                {roomData.category}
              </div>

              {/* Who is actually winning. The card used to show one generic
                  stock photo, which said nothing about the room. */}
              {roomData.leader && (
                <Link
                  href={`/profile/${roomData.leader.entityId}`}
                  className="pressable absolute bottom-3 left-3 flex items-center gap-2 bg-black/60
                             backdrop-blur-md border border-white/15 cut-corner pl-1.5 pr-3 py-1.5
                             hover:border-primary/60 transition-colors group/leader max-w-[90%]"
                >
                  <span className="relative w-8 h-8 shrink-0 cut-corner overflow-hidden bg-background">
                    {roomData.leader.img ? (
                      <Image
                        src={roomData.leader.img}
                        alt={roomData.leader.name}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      <span
                        className="w-full h-full flex items-center justify-center font-arcade text-xs font-bold text-black"
                        style={{ backgroundColor: roomData.leader.color ?? "#FF7A00" }}
                      >
                        {roomData.leader.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>

                  <span className="flex flex-col min-w-0">
                    <span className="font-arcade text-[8px] uppercase tracking-widest text-battle-yellow leading-none">
                      Leading
                    </span>
                    <span className="font-arcade text-xs font-bold text-white truncate group-hover/leader:text-primary transition-colors">
                      {roomData.leader.name}
                    </span>
                  </span>
                </Link>
              )}
            </div>
            
            {/* Details */}
            <div className="p-6 -mt-8 relative z-10">
              <h1 className="text-3xl md:text-4xl font-arcade font-black text-foreground uppercase tracking-wider mb-4 leading-none">
                {roomData.title}
              </h1>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-background border border-border cut-corner">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-battle-yellow" />
                    <span className="font-arcade text-foreground/50 text-xs">TOTAL POOL</span>
                  </div>
                  <span className="text-xl font-arcade font-bold text-battle-yellow">${roomData.totalPool.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-background border border-border cut-corner">
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary" />
                    <span className="font-arcade text-foreground/50 text-xs">TIME LEFT</span>
                  </div>
                  <Countdown target={roomData.expiresAt} size="sm" />
                </div>
              </div>
              
              <p className="mt-6 text-xs text-foreground/50 font-sans border-l-2 border-battle-pink pl-3">
                30% of total pool proceeds will be donated to <strong className="text-foreground">{roomData.charity}</strong>.
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
              onClick={() => setIsAddModalOpen(true)}
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
                {topThree.map((entity: any, index: number) => {
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

                      <button 
                        onClick={() => handleVoteClick(entity.id)}
                        className="w-full cut-corner py-3 font-arcade font-bold text-xs transition-all hover:brightness-110 relative z-10" 
                        style={{ backgroundColor: entity.color, color: "#000" }}
                      >
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
                {theRest.map((entity: any, index: number) => (
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
                      <button 
                        onClick={() => handleVoteClick(entity.id)}
                        className="hidden md:block cut-corner px-6 py-2 font-arcade font-bold text-xs transition-all hover:brightness-110" 
                        style={{ backgroundColor: entity.color, color: "#000" }}
                      >
                        VOTE
                      </button>
                      <button 
                        onClick={() => handleVoteClick(entity.id)}
                        className="md:hidden cut-corner p-2 font-arcade font-bold text-xs transition-all hover:brightness-110" 
                        style={{ backgroundColor: entity.color, color: "#000" }}
                      >
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
                onClick={() => setIsAddModalOpen(true)}
                className="cut-corner border border-primary text-primary px-6 py-2 font-arcade text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                ADD THEM TO THE ARENA ($5)
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Paid battle cries. Paged — an arena with thousands of messages must
          not ship all of them in the initial payload. */}
      <section className="w-full max-w-5xl mx-auto px-4 md:px-0 py-8 md:py-10">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-arcade text-base md:text-xl font-bold uppercase tracking-widest text-foreground">
            Battle cries
          </h2>
        </div>
        <FeedList
          roomId={roomData.id}
          initialItems={roomData.feed ?? []}
          initialCursor={roomData.feedCursor ?? null}
          initialHasMore={roomData.feedHasMore ?? false}
        />
      </section>

      {/* --- MODALS --- */}
      <AddContenderModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        roomTitle={roomData.title} 
        roomId={roomData.id}
      />

      <VoteModal 
        isOpen={isVoteModalOpen} 
        onClose={() => setIsVoteModalOpen(false)} 
        battle={syntheticBattleForModal}
        contenderIndex={selectedContenderIndex}
      />
      
    </div>
  );
}