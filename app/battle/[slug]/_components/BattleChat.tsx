"use client";

import { motion } from "framer-motion";
import { MessageSquare, Flame, Zap, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function BattleChat({ 
  battle, 
  onVoteClick 
}: { 
  battle: any;
  onVoteClick: (index: number) => void;
}) {
  
  const getMessageStyle = (amount: number) => {
    if (amount >= 50) return `border-l-4 border-yellow-400 bg-yellow-400/10 text-yellow-700 dark:text-yellow-100`; 
    if (amount >= 15) return `border-l-4 bg-foreground/5`; 
    return `border-l-2 bg-transparent opacity-80`; 
  };

  return (
    <div className="w-full h-full flex flex-col bg-card border-l border-border relative">
      
      {/* HEADER */}
      <div className="p-4 border-b border-border bg-background flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="font-arcade text-sm text-foreground font-bold tracking-wider">LIVE FEED</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-arcade text-green-500">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* CHAT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide bg-card">
        {/* We map over the real live votes now! */}
        {battle.recentVotes?.map((msg: any, i: number) => {
          const isWhale = msg.amount >= 50;
          
          // Match the vote to the contender to get their brand color
          const contenderColor = battle.contenders.find((c: any) => c.id === msg.contender_id)?.color || "#FFFFFF";

          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }} // Stagger initial load
              key={msg.id}
              className={`p-3 cut-corner transition-all ${getMessageStyle(msg.amount)}`}
              style={{ borderLeftColor: isWhale ? "#FACC15" : contenderColor }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-background cut-corner overflow-hidden border border-border">
                    <Image src={msg.voter_avatar} alt={msg.voter_name} width={24} height={24} className="opacity-80" />
                  </div>
                  <span className="font-arcade text-xs text-foreground/80 font-bold">{msg.voter_name}</span>
                </div>
                
                <div 
                  className={`flex items-center gap-1 font-arcade text-xs px-2 py-0.5 cut-corner ${isWhale ? 'bg-yellow-400 text-black font-bold' : 'bg-background text-foreground'}`}
                  style={{ border: isWhale ? 'none' : `1px solid ${contenderColor}` }}
                >
                  {isWhale ? <Flame className="w-3 h-3" /> : <Zap className="w-3 h-3" style={{ color: contenderColor }} />}
                  ${msg.amount}
                </div>
              </div>
              
              <p className="text-sm font-sans text-foreground leading-relaxed">
                {msg.message}
              </p>
            </motion.div>
          );
        })}

        {battle.recentVotes?.length === 0 && (
          <div className="text-center font-arcade text-xs text-foreground/30 mt-10">
            NO BATTLE CRIES YET. BE THE FIRST!
          </div>
        )}
      </div>

      {/* STICKY FOOTER */}
      <div className="p-4 bg-background border-t border-border shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <div className="text-center mb-3">
          <span className="font-arcade text-xs text-foreground/50 tracking-widest">BACK YOUR CONTENDER</span>
        </div>
        
        <div className="flex flex-col gap-2">
          <button onClick={() => onVoteClick(0)} className="w-full cut-corner py-3 font-arcade font-bold text-sm flex items-center justify-between px-4 transition-all hover:brightness-110 shadow-md" style={{ backgroundColor: battle.contenders[0].color, color: "#000" }}>
            <span>VOTE {battle.contenders[0].name.toUpperCase()}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button onClick={() => onVoteClick(1)} className="w-full cut-corner py-3 font-arcade font-bold text-sm flex items-center justify-between px-4 transition-all hover:brightness-110 shadow-md text-white" style={{ backgroundColor: battle.contenders[1].color }}>
            <span>VOTE {battle.contenders[1].name.toUpperCase()}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}