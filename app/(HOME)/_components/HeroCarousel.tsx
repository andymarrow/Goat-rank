"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Timer, Swords, ImageOff } from "lucide-react";
import { ZapIcon } from "@/components/ui/zap";
import type { LandingRoom } from "@/actions/getLanding";
import { readableBrand } from "@/lib/color";

const money = (n: number) => `$${(Number(n) || 0).toLocaleString("en-US")}`;

function countdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "ENDED";

  const h = Math.floor(ms / 3_600_000);
  if (h >= 24) return `${Math.floor(h / 24)}D ${h % 24}H`;

  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function HeroCarousel({ rooms }: { rooms: LandingRoom[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (rooms.length === 0) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="corner-ticks relative cut-corner-lg border border-dashed border-border bg-card overflow-hidden py-20 text-center">
          <div className="tex-grid absolute inset-0 pointer-events-none" />
          <div className="tex-hatch absolute inset-0 pointer-events-none" />

          <Swords className="relative w-8 h-8 mx-auto mb-4 text-foreground/25" />
          <h2 className="relative font-arcade text-lg md:text-xl font-bold uppercase tracking-widest text-foreground/70">
            No live arenas yet
          </h2>
          <p className="relative mt-2 text-sm text-foreground/45 font-sans max-w-sm mx-auto">
            Nothing is running right now. Deploy the first contest and it lands here.
          </p>
          <Link
            href="/create"
            className="pressable sheen relative inline-flex items-center gap-2 mt-6 cut-corner
                       bg-primary text-primary-foreground px-6 py-3 font-arcade text-xs font-bold
                       uppercase tracking-widest overflow-hidden hover:brightness-110 transition-all"
          >
            <Swords className="w-4 h-4" /> Host a battle
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 h-[70vh] min-h-[500px] md:h-[600px]">
      <div className="flex flex-col md:flex-row w-full h-full gap-2 md:gap-4">
        {rooms.map((room, index) => {
          const isActive = activeIndex === index;
          const is1v1 = room.room_type === "1v1";
          const [left, right] = room.contenders;
          const href = `${is1v1 ? "/battle" : "/global"}/${room.id}`;

          const pool = is1v1
            ? (left?.current_votes ?? 0) + (right?.current_votes ?? 0)
            : room.total_pool;
          const leftPct = pool > 0 ? ((left?.current_votes ?? 0) / pool) * 100 : 50;

          return (
            <motion.div
              key={room.id}
              layout
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              className="cut-corner-lg relative overflow-hidden group bg-black border border-border"
              initial={false}
              animate={{ flex: isActive ? 3 : 1 }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            >
              {/* Artwork */}
              {is1v1 && left && right ? (
                <div className="absolute inset-0 w-full h-full bg-[#121417] flex items-end justify-between">
                  {[left, right].map((c, i) => (
                    <div
                      key={i}
                      className={`relative h-[90%] w-[45%] transition-all duration-300 ${
                        !isActive ? "opacity-30 grayscale" : ""
                      }`}
                    >
                      {c.image_url ? (
                        <Image
                          src={c.image_url}
                          alt={c.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className={`object-contain ${i === 0 ? "object-bottom-left" : "object-bottom-right"}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-end justify-center pb-8">
                          <span
                            className="font-arcade text-2xl sm:text-3xl md:text-4xl font-black opacity-40"
                            style={{ color: c.brand_color ?? "#FFFFFF" }}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full">
                  {room.cover_image ? (
                    <Image
                      src={room.cover_image}
                      alt={room.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 66vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#121417] flex items-center justify-center">
                      <ImageOff className="w-8 h-8 text-white/15" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50" />
                </div>
              )}

              <div className="tex-dots absolute inset-0 z-0 pointer-events-none" />
              {isActive && <div className="tex-scanlines absolute inset-0 z-0 pointer-events-none" />}

              {/* Overlay */}
              <motion.div
                className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between z-10 pointer-events-none"
                animate={{ opacity: isActive ? 1 : 0.5 }}
              >
                <div className="flex justify-between items-start">
                  <span className="cut-corner px-4 py-1.5 text-xs font-arcade font-bold uppercase text-white bg-white/15 backdrop-blur-md border border-white/10">
                    {room.category}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-2 text-white font-arcade text-xs bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 cut-corner">
                      <ZapIcon size={16} className="text-primary" /> LIVE
                    </span>
                  )}
                </div>

                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="corner-ticks w-full max-w-2xl mx-auto bg-black/40 backdrop-blur-xl border border-white/10 p-6 cut-corner flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-end gap-4">
                      <h2 className="text-white text-2xl md:text-3xl font-arcade uppercase font-bold tracking-wider min-w-0 truncate group-hover:text-primary transition-colors">
                        {room.title}
                      </h2>
                      <div className="flex items-center gap-2 text-white/80 font-arcade shrink-0">
                        <Timer className="w-4 h-4" />
                        <span>{countdown(room.expires_at)}</span>
                      </div>
                    </div>

                    {is1v1 && left && right ? (
                      <div className="w-full">
                        <div className="flex justify-between text-xs md:text-sm font-arcade mb-2 gap-3">
                          <span
                            className="truncate"
                            style={{ color: readableBrand(left.brand_color, true) }}
                          >
                            {left.name} — {money(left.current_votes)}
                          </span>
                          <span
                            className="truncate text-right"
                            style={{ color: readableBrand(right.brand_color, true) }}
                          >
                            {right.name} — {money(right.current_votes)}
                          </span>
                        </div>

                        <div className="w-full h-4 bg-black/50 cut-corner flex overflow-hidden border border-white/10 relative">
                          <motion.div
                            className="h-full"
                            style={{ backgroundColor: left.brand_color ?? "#FF7A00" }}
                            initial={{ width: "50%" }}
                            animate={{ width: `${leftPct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                          <div
                            className="h-full flex-1"
                            style={{ backgroundColor: right.brand_color ?? "#3B82F6" }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between font-arcade">
                        <span className="text-white/60 text-xs uppercase tracking-widest">
                          Total pool
                        </span>
                        <span className="text-yellow-400 text-xl font-bold">
                          {money(room.total_pool)}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>

              {/* Whole-panel link. Sits above the overlay (which is made
                  pointer-events-none) so a click anywhere on the card opens
                  the arena, not just the title. */}
              <Link href={href} aria-label={room.title} className="absolute inset-0 z-20" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
