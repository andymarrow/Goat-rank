"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Timer, Trophy, Zap } from "lucide-react";
import Image from "next/image";

// New Data Structure supporting both types
const TRENDING_BATTLES = [
  {
    id: "b1",
    type: "1v1",
    title: "The GOAT Battle",
    category: "Soccer",
    timeLeft: "12:45:00",
    contenders: [
      { name: "Ronaldo", image: "/image/ronaldo.png", color: "#F9F8F3", amount: 12450 }, // White
      { name: "Messi", image: "/image/messi.png", color: "#3B82F6", amount: 9800 }  // Blue
    ],
    // Note: You will replace the unsplash links above with your transparent PNGs of the players.
  },
  {
    id: "b2",
    type: "global",
    title: "Best Code Editor",
    category: "Tech",
    timeLeft: "04:12:30",
    pool: "$8,200",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80",
    color: "var(--primary)",
  },
];

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 h-[70vh] min-h-[500px] md:h-[600px]">
      <div className="flex flex-col md:flex-row w-full h-full gap-2 md:gap-4">
        {TRENDING_BATTLES.map((battle, index) => {
          const isActive = activeIndex === index;

          return (
            <motion.button
              key={battle.id}
              layout
              type="button"
              aria-label={`${battle.title} — ${battle.category}`}
              aria-pressed={isActive}
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              className="pressable cut-corner-lg relative overflow-hidden cursor-pointer group bg-black border border-border text-left"
              initial={false}
              animate={{ flex: isActive ? 3 : 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            >
              {/* --- 1v1 MATCH LAYOUT --- */}
              {battle.type === "1v1" && battle.contenders && (
                <div className="absolute inset-0 w-full h-full bg-[#121417] flex items-end justify-between">
                  {/* Left Contender */}
                  <div className={`relative h-[90%] w-[45%] transition-opacity duration-300 ${!isActive && "opacity-30 grayscale"}`}>
                    <Image src={battle.contenders[0].image} alt={battle.contenders[0].name} fill className="object-contain object-bottom-left" />
                  </div>
                  {/* Right Contender */}
                  <div className={`relative h-[90%] w-[45%] transition-opacity duration-300 ${!isActive && "opacity-30 grayscale"}`}>
                    <Image src={battle.contenders[1].image} alt={battle.contenders[1].name} fill className="object-contain object-bottom-right" />
                  </div>
                </div>
              )}

              {/* --- GLOBAL CATEGORY LAYOUT --- */}
              {battle.type === "global" && battle.image && (
                <div className="absolute inset-0 w-full h-full">
                  <Image src={battle.image} alt={battle.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/50" />
                </div>
              )}

              {/* Surface texture over the artwork, beneath the UI overlay.
                  Scanlines only on the expanded card — at rail width they
                  moire against the shrunken artwork. */}
              <div className="tex-dots absolute inset-0 z-0 pointer-events-none" />
              {isActive && (
                <div className="tex-scanlines absolute inset-0 z-0 pointer-events-none" />
              )}

              {/* UI OVERLAY */}
              <motion.div 
                className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between z-10"
                animate={{ opacity: isActive ? 1 : 0.5 }}
              >
                {/* Top: Category & Timer */}
                <div className="flex justify-between items-start">
                  <span className="cut-corner px-4 py-1.5 text-xs font-arcade font-bold uppercase text-white bg-foreground/20 backdrop-blur-md border border-white/10">
                    {battle.category}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-2 text-white font-arcade bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 cut-corner">
                      <Zap className="w-4 h-4 text-primary" fill="currentColor" /> 
                      LIVE
                    </span>
                  )}
                </div>

                {/* Bottom: Glassmorphism Stats & Tug of War */}
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="corner-ticks w-full max-w-2xl mx-auto bg-black/40 backdrop-blur-xl border border-white/10 p-6 cut-corner flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-end">
                      <h2 className="text-white text-3xl font-arcade uppercase font-bold tracking-wider">
                        {battle.title}
                      </h2>
                      <div className="flex items-center gap-2 text-white/80 font-arcade">
                        <Timer className="w-4 h-4" />
                        <span>{battle.timeLeft}</span>
                      </div>
                    </div>

                    {/* Tug of War Bar (Only for 1v1) */}
                    {battle.type === "1v1" && battle.contenders && (
                      <div className="w-full">
                        <div className="flex justify-between text-sm font-arcade mb-2">
                          <span style={{ color: battle.contenders[0].color }}>{battle.contenders[0].name} - ${battle.contenders[0].amount.toLocaleString()}</span>
                          <span style={{ color: battle.contenders[1].color }}>{battle.contenders[1].name} - ${battle.contenders[1].amount.toLocaleString()}</span>
                        </div>
                        
                        {/* The Bar */}
                        <div className="w-full h-4 bg-black/50 cut-corner flex overflow-hidden border border-white/10 relative">
                          <motion.div 
                            className="h-full"
                            style={{ backgroundColor: battle.contenders[0].color }}
                            initial={{ width: "50%" }}
                            animate={{ width: `${(battle.contenders[0].amount / (battle.contenders[0].amount + battle.contenders[1].amount)) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                          <motion.div 
                            className="h-full"
                            style={{ backgroundColor: battle.contenders[1].color }}
                            initial={{ width: "50%" }}
                            animate={{ width: `${(battle.contenders[1].amount / (battle.contenders[0].amount + battle.contenders[1].amount)) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}