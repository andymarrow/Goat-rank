"use client";

import { motion } from "framer-motion";
import { MessageSquare, Flame, Zap, ChevronRight } from "lucide-react";
import Image from "next/image";

// Mock SuperChat Data
const MOCK_MESSAGES = [
  { id: "m1", user: "Ridge", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Ridge", amount: 5, contender: "Ronaldo", color: "#F9F8F3", text: "Siuuu! Not even a debate." },
  { id: "m2", user: "Willow", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Willow", amount: 20, contender: "Messi", color: "#3B82F6", text: "8 Ballon d'Ors. Case closed." },
  { id: "m3", user: "Thorn", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Thorn", amount: 3, contender: "Ronaldo", color: "#F9F8F3", text: "Best goalscorer in history!" },
  { id: "m4", user: "Fell", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Fell", amount: 100, contender: "Messi", color: "#3B82F6", text: "MESSI IS THE UNDISPUTED GOAT! 🐐🇦🇷" },
];

export default function BattleChat({ 
  battle, 
  onVoteClick 
}: { 
  battle: any;
  onVoteClick: (index: number) => void;
}) {
  
  // Helper to determine message styling based on amount paid
  const getMessageStyle = (amount: number, contenderColor: string) => {
    if (amount >= 50) return `border-l-4 border-yellow-400 bg-yellow-400/10 text-yellow-100`; // Premium Whale
    if (amount >= 15) return `border-l-4 bg-white/5`; // Mid-tier
    return `border-l-2 bg-transparent opacity-80`; // Standard
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] border-l border-white/5 relative">
      
      {/* --- HEADER --- */}
      <div className="p-4 border-b border-white/10 bg-[#0A0A0C] flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="font-arcade text-sm text-white font-bold tracking-wider">LIVE ARENA FEED</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-arcade text-green-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          8,241 VIEWING
        </div>
      </div>

      {/* --- CHAT SCROLL AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide">
        {MOCK_MESSAGES.map((msg, i) => {
          const isWhale = msg.amount >= 50;

          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={msg.id}
              className={`p-3 cut-corner transition-all ${getMessageStyle(msg.amount, msg.color)}`}
              style={{ borderLeftColor: isWhale ? "#FACC15" : msg.color }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-black cut-corner overflow-hidden border border-white/10">
                    <Image src={msg.avatar} alt={msg.user} width={24} height={24} className="opacity-80" />
                  </div>
                  <span className="font-arcade text-xs text-white/80 font-bold">{msg.user}</span>
                </div>
                
                {/* Amount Badge */}
                <div 
                  className={`flex items-center gap-1 font-arcade text-xs px-2 py-0.5 cut-corner ${isWhale ? 'bg-yellow-400 text-black font-bold' : 'bg-black text-white'}`}
                  style={{ border: isWhale ? 'none' : `1px solid ${msg.color}` }}
                >
                  {isWhale ? <Flame className="w-3 h-3" /> : <Zap className="w-3 h-3" style={{ color: msg.color }} />}
                  ${msg.amount}
                </div>
              </div>
              
              {/* Message Content - Using sans font for readability */}
              <p className="text-sm font-sans text-white leading-relaxed">
                {msg.text}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* --- STICKY FOOTER: CALL TO ACTION --- */}
      <div className="p-4 bg-[#0A0A0C] border-t border-white/10">
        <div className="text-center mb-3">
          <span className="font-arcade text-xs text-white/50 tracking-widest">BACK YOUR CONTENDER</span>
        </div>
        
        <div className="flex flex-col gap-2">
          {/* Button 0 (Left Contender) */}
          <button 
            onClick={() => onVoteClick(0)}
            className="w-full cut-corner py-3 font-arcade font-bold text-sm flex items-center justify-between px-4 transition-all hover:brightness-125 cursor-pointer"
            style={{ backgroundColor: battle.contenders[0].color, color: "#000" }}
          >
            <span>VOTE {battle.contenders[0].name.toUpperCase()}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {/* Button 1 (Right Contender) */}
          <button 
            onClick={() => onVoteClick(1)}
            className="w-full cut-corner py-3 font-arcade font-bold text-sm flex items-center justify-between px-4 transition-all hover:brightness-125 text-white cursor-pointer"
            style={{ backgroundColor: battle.contenders[1].color }}
          >
            <span>VOTE {battle.contenders[1].name.toUpperCase()}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}