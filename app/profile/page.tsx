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
    <div className="w-full max-w-[1600px] mx-auto md:px-8 py-6 md:py-10 pb-28 font-sans">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Trophy className="w-5 h-5 shrink-0" />
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-foreground">
          The Roster
        </h1>
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold ml-auto shrink-0">
          {roster.length} contenders
        </span>
      </div>

      {roster.length === 0 ? (
        <div className="relative border border-dashed border-border/80 rounded-2xl py-16 text-center overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            No contenders yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {roster.map((entity, i) => (
            <Link
              key={entity.id}
              href={`/profile/${entity.id}`}
              className="relative bg-card border border-border/80 rounded-2xl overflow-hidden group hover:border-primary/50 transition-all shadow-xs flex flex-col"
            >
              <div className="relative aspect-square bg-muted">
                {entity.image_url ? (
                  <Image
                    src={entity.image_url}
                    alt={entity.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageOff className="w-5 h-5" />
                  </div>
                )}
                <span
                  className="absolute bottom-0 inset-x-0 h-1"
                  style={{ backgroundColor: entity.brand_color ?? "#FF7A00" }}
                />
                {i < 3 && (
                  <span className="absolute top-2 left-2 text-[10px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-md shadow-xs">
                    #{i + 1}
                  </span>
                )}
              </div>

              <div className="relative p-3 flex flex-col justify-between flex-1">
                <h2 className="text-xs font-bold text-foreground truncate">
                  {entity.name}
                </h2>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className="text-[11px] text-muted-foreground font-semibold truncate">
                    {entity.category}
                  </span>
                  <span className="text-xs font-extrabold text-amber-400 shrink-0 tabular-nums">
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

