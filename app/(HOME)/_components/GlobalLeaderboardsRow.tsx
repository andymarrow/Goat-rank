"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Users, Trophy, ImageOff } from "lucide-react";
import type { LandingRoom } from "@/actions/getLanding";

const money = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(Math.round(n));

const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

export default function GlobalLeaderboardsRow({ rooms }: { rooms: LandingRoom[] }) {
  const [activeFilter, setActiveFilter] = useState("All");

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
      <section className="w-full max-w-[1920px] mx-auto md:px-12 py-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-6">
          Global Arenas
        </h2>
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <Trophy className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">
            No global arenas live yet
          </p>
        </div>
      </section>
    );
  }

  const half = Math.ceil(visible.length / 2);
  const row1 = visible.slice(0, half);
  const row2 = visible.slice(half);

  const renderCard = (room: LandingRoom, isGrid = false) => {
    return (
      <Link
        href={`/global/${room.id}`}
        key={room.id}
        className={`${isGrid ? "w-full" : "w-[280px] sm:w-[320px] shrink-0 snap-start"} group`}
      >
        <div className="relative w-full h-[270px] md:h-[285px] rounded-2xl bg-card border border-border/80 p-3.5 sm:p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-200 ease-out group-hover:-translate-y-0.5 shadow-sm">
          {/* Top Cover Image Box */}
          <div className="relative w-full h-[150px] md:h-[165px] rounded-xl overflow-hidden bg-muted/60 border border-border/50 shrink-0">
            {room.cover_image ? (
              <Image
                src={room.cover_image}
                alt={room.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 450px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <ImageOff className="w-8 h-8" />
              </div>
            )}
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
          </div>

          {/* Bottom Content & Info */}
          <div className="flex flex-col justify-between flex-1 min-w-0 pt-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground truncate max-w-[130px]">
                  {room.category}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1 tracking-tight">
                {room.title}
              </h3>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40 mt-2">
              <span className="font-semibold text-yellow-500 font-sans">
                {money(room.total_pool)}{" "}
                <span className="font-normal text-muted-foreground text-[11px]">pool</span>
              </span>
              <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {compact(room.vote_count)} votes
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section className="w-full py-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5 group cursor-pointer">
            Global Arenas
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </h2>
        </div>

        {filters.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide p-1 rounded-full bg-card border border-border/80 shadow-xs">
            {filters.map((f) => {
              const active = activeFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  aria-pressed={active}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Grid Layout (lg and up) - 2 rows max (8 items) */}
      <div className="hidden lg:grid grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5 pt-2 pb-2">
        {visible.slice(0, 8).map((room) => renderCard(room, true))}
      </div>

      {/* Mobile/Tablet Horizontal Scroll Rows (only when overflowing / < lg) */}
      <div className="flex lg:hidden flex-col gap-3.5 sm:gap-4 pt-2 pb-2">
        <div className="flex gap-3.5 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
          {row1.map((room) => renderCard(room, false))}
        </div>

        {row2.length > 0 && (
          <div className="flex gap-3.5 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {row2.map((room) => renderCard(room, false))}
          </div>
        )}
      </div>
    </section>
  );
}
