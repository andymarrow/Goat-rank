"use client";

import Link from "next/link";
import { Archive, Crown, ChevronRight } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import type { LandingRoom } from "@/actions/getLanding";
import { finalStanding, isDraw, shareOf } from "@/lib/arena";
import { formatSince } from "@/lib/time";

const money = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

/**
 * Arenas that are over.
 *
 * Kept out of the hero and the two live rails and given a quieter section at
 * the foot of the page. A finished contest is a result to read, and putting
 * one where a live arena goes is offering a backer a button that cannot do
 * anything. Here the card leads with the winner instead of a call to back,
 * which is the honest version of the same information.
 */
export default function FinishedArenasRow({ rooms }: { rooms: LandingRoom[] }) {
  if (rooms.length === 0) return null;

  return (
    <section className="w-full max-w-[1920px] mx-auto md:px-12 py-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="rounded-xl bg-muted/60 border border-border/60 p-2 text-muted-foreground">
          <Archive className="w-4 h-4" />
        </span>

        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Settled arenas
          </h2>
          <p className="text-xs text-muted-foreground font-sans">
            Closed contests and who took them. Still readable, no longer backable.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {rooms.map((room) => {
          const ranked = finalStanding(
            room.contenders.map((c) => ({
              name: c.name,
              amount: c.current_votes,
              image: c.image_url,
              color: c.brand_color,
            }))
          );

          const champion = ranked[0];
          const drawn = isDraw(ranked);

          return (
            <Link
              key={room.id}
              href={`/${room.room_type === "global" ? "global" : "battle"}/${room.id}`}
              className="group rounded-2xl border border-border/70 bg-card/60 p-4 shadow-xs
                         hover:border-border hover:bg-card transition-colors flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {room.category}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 ml-auto">
                  ended {formatSince(room.expires_at)}
                </span>
              </div>

              <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                {room.title}
              </h3>

              {champion && (
                <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-2">
                  <Avatar
                    src={champion.image}
                    name={champion.name}
                    size={32}
                    color={champion.color}
                    className="!rounded-lg"
                  />

                  <div className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {drawn ? (
                        "Dead heat"
                      ) : (
                        <>
                          <Crown className="w-2.5 h-2.5 text-amber-500" /> Winner
                        </>
                      )}
                    </span>
                    <span className="font-bold text-xs text-foreground truncate block">
                      {drawn ? `${ranked[0].name} & ${ranked[1]?.name}` : champion.name}
                    </span>
                  </div>

                  {!drawn && room.total_pool > 0 && (
                    <span className="shrink-0 font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
                      {shareOf(champion.amount, room.total_pool)}%
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                <span className="text-xs text-muted-foreground">
                  <strong className="text-foreground font-bold tabular-nums">
                    {money(room.total_pool)}
                  </strong>{" "}
                  final pool
                </span>

                <span className="inline-flex items-center gap-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                  Result <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
