"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Swords, TrendingUp } from "lucide-react";
import Image from "next/image";

const SUB_CATEGORIES = ["All", "Soccer", "Basketball", "Racing", "Tech", "Movies"];

// Mock data for the feed
const ARENA_BATTLES = [
  { id: "f1", category: "Soccer", title: "Best Club Manager", pool: "$5,100", image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80" },
  { id: "f2", category: "Basketball", title: "The True GOAT", pool: "$12,400", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80" },
  { id: "f3", category: "Racing", title: "F1 Constructor Kings", pool: "$3,200", image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80" },
  { id: "f4", category: "Tech", title: "Top AI Assistant", pool: "$8,900", image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80" },
  { id: "f5", category: "Movies", title: "Best Sci-Fi Franchise", pool: "$6,500", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80" },
  { id: "f6", category: "Soccer", title: "Golden Boot 2024", pool: "$4,100", image: "https://images.unsplash.com/photo-1574629810360-7efbb6b0807e?w=800&q=80" },
];

export default function ArenaFeed() {
  const [activeTab, setActiveTab] = useState("All");

  // Filter logic
  const filteredBattles = ARENA_BATTLES.filter(
    (battle) => activeTab === "All" || battle.category === activeTab
  );

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-12">
      
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl md:text-3xl font-arcade font-bold text-foreground flex items-center gap-3">
          <TrendingUp className="text-primary w-6 h-6 md:w-8 md:h-8" />
          ACTIVE ARENA
        </h3>
      </div>

      {/* 
        Sub-Category Tabs 
        Scrollable on mobile, hidden scrollbar. Sharp gaming aesthetics.
      */}
      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-4 mb-4 scrollbar-hide w-full">
        {SUB_CATEGORIES.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-2.5 font-arcade text-sm transition-all duration-300 cut-corner ${
                isActive 
                  ? "bg-primary text-primary-foreground border-b-2 border-yellow-400 shadow-[0_0_15px_rgba(255,122,0,0.3)]" 
                  : "bg-black/10 dark:bg-white/5 text-foreground/60 hover:text-foreground hover:bg-black/20 dark:hover:bg-white/10"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 
        Filtered Grid with Framer Motion AnimatePresence 
        This ensures cards smoothly pop in and out when filtering.
      */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredBattles.map((battle) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              key={battle.id}
              className="group cursor-pointer"
            >
              <div className="relative h-64 w-full cut-corner overflow-hidden bg-black border border-border">
                {/* Background Image */}
                <Image 
                  src={battle.image} 
                  alt={battle.title} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80" 
                />
                
                {/* Bottom Gradient for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Card Content Overlay */}
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="cut-corner px-3 py-1 bg-white/10 backdrop-blur-md text-xs font-arcade text-white border border-white/20">
                      {battle.category}
                    </span>
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 cut-corner border border-white/10 text-primary font-arcade text-xs">
                      <Swords className="w-3 h-3" /> LIVE
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-arcade text-white font-bold mb-2 group-hover:text-primary transition-colors">
                      {battle.title}
                    </h4>
                    <div className="flex items-center justify-between text-white/80 font-arcade text-sm bg-black/40 backdrop-blur-md p-3 cut-corner border border-white/10">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-primary" />
                        <span>24:00:00</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 font-bold">{battle.pool}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}