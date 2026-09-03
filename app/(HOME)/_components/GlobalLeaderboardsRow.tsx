"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Users, Flame, Trophy } from "lucide-react";
import type { LandingRoom } from "@/actions/getLanding";

const money = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;

const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

export default function GlobalLeaderboardsRow({ rooms }: { rooms: LandingRoom[] }) {
  const [activeFilter, setActiveFilter] = useState("All");

  // Filters are built from the categories that actually have arenas, rather
  // than a hardcoded list that could offer a category with nothing behind it.
  const filters = useMemo(
    () => ["All", ...[...new Set(rooms.map((r) => r.category).filter(Boolean))].sort()],
    [rooms]
  );

  const visible =
    activeFilter === "All"
      ? rooms
      : rooms.filter((r) => r.category?.toLowerCase() === activeFilter.toLowerCase());

  if (rooms.length === 0) {
    return (
      <section className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8">
        <h2 className="text-2xl md:text-3xl font-arcade font-bold text-foreground mb-6">
          Global Arenas
        </h2>
        <div className="corner-ticks relative border border-dashed border-border cut-corner py-14 text-center overflow-hidden">
          <div className="tex-hatch absolute inset-0 pointer-events-none" />
          <Trophy className="relative w-6 h-6 mx-auto mb-3 text-foreground/25" />
          <p className="relative font-arcade text-xs uppercase tracking-widest text-foreground/40">
            No global arenas live yet
          </p>
          <Link
            href="/create"
            className="relative inline-block mt-4 cut-corner bg-primary text-primary-foreground
                       px-5 py-2 font-arcade text-[10px] font-bold uppercase tracking-widest
                       hover:brightness-110 transition-all pressable"
          >
            Deploy the first
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1920px] mx-auto px-6 md:px-12 py-8">
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
        <h2 className="text-2xl md:text-3xl font-arcade font-bold text-foreground flex items-center gap-2 group">
          Global Arenas
          <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
        </h2>

        {filters.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                aria-pressed={activeFilter === f}
                className={`pressable px-4 py-1.5 rounded-full text-xs font-arcade transition-colors whitespace-nowrap border ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-foreground/60 border-border hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 snap-x snap-mandatory">
        {visible.map((room, index) => (
          <Link
            href={`/global/${room.id}`}
            key={room.id}
            className="pressable hover-lift snap-start shrink-0 group"
          >
            <div className="corner-ticks relative w-[300px] md:w-[400px] aspect-[16/9] cut-corner overflow-hidden bg-black border border-border group-hover:border-primary/50 transition-colors">
              {room.cover_image ? (
                <Image
                  src={room.cover_image}
                  alt={room.title}
                  fill
                  sizes="(max-width: 768px) 300px, 400px"
                  className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                />
              ) : (
                <div className="absolute inset-0 tex-dots opacity-100" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="tex-scanlines absolute inset-0 pointer-events-none" />

              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                  <Flame className="w-4 h-4" />
                </div>
              </div>

              {/* Rank is positional within the current filter, so it always
                  reads 1..n rather than skipping numbers. */}
              <div className="absolute bottom-0 left-0 p-4 flex items-end gap-3 w-full">
                <span className="text-6xl md:text-7xl font-arcade font-black striped-text leading-none select-none">
                  {index + 1}
                </span>

                <div className="flex flex-col pb-1 min-w-0">
                  <h3 className="text-lg font-arcade font-bold text-white leading-tight mb-1 truncate">
                    {room.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] font-arcade text-white/70">
                    <span className="text-yellow-400">{money(room.total_pool)} Pool</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {compact(room.vote_count)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
