import Image from "next/image";
import Link from "next/link";
import { Trophy, ImageOff } from "lucide-react";
import { getRoster } from "@/actions/getRoster";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${(Number(n) || 0).toFixed(0)}`;

/**
 * Contender directory.
 *
 * The mobile tab bar needs a fifth destination, and /profile previously only
 * existed as /profile/[slug] — linking to it bare would have 404'd.
 */
export default async function RosterPage() {
  const roster = await getRoster();

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-10 pb-28">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />
        <h1 className="font-arcade text-xl md:text-3xl font-bold uppercase tracking-wider text-foreground">
          The Roster
        </h1>
        <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/40 ml-auto shrink-0">
          {roster.length} contenders
        </span>
      </div>

      {roster.length === 0 ? (
        <div className="corner-ticks relative border border-dashed border-border cut-corner py-16 text-center overflow-hidden">
          <div className="tex-hatch absolute inset-0 pointer-events-none" />
          <p className="relative font-arcade text-xs uppercase tracking-widest text-foreground/40">
            No contenders yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {roster.map((entity, i) => (
            <Link
              key={entity.id}
              href={`/profile/${entity.id}`}
              className="pressable hover-lift corner-ticks relative bg-card border border-border cut-corner
                         overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="tex-dots absolute inset-0 pointer-events-none z-10" />

              <div className="relative aspect-square bg-background">
                {entity.image_url ? (
                  <Image
                    src={entity.image_url}
                    alt={entity.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground/20">
                    <ImageOff className="w-5 h-5" />
                  </div>
                )}
                <span
                  className="absolute bottom-0 inset-x-0 h-1"
                  style={{ backgroundColor: entity.brand_color ?? "#FF7A00" }}
                />
                {i < 3 && (
                  <span className="absolute top-1.5 left-1.5 font-arcade text-[9px] font-black
                                   bg-primary text-primary-foreground px-1.5 py-0.5 cut-corner">
                    #{i + 1}
                  </span>
                )}
              </div>

              <div className="relative p-2.5">
                <h2 className="font-arcade text-[11px] md:text-xs font-bold text-foreground truncate">
                  {entity.name}
                </h2>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[10px] text-foreground/40 font-sans truncate">
                    {entity.category}
                  </span>
                  <span className="font-arcade text-[10px] text-battle-yellow shrink-0 tabular-nums">
                    {money(entity.lifetime_raised)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
