import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Swords, TrendingUp, Trophy, ArrowUpRight, Ban } from "lucide-react";

import { getUserProfile } from "@/actions/getUserProfile";
import { formatSince } from "@/lib/time";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getUserProfile(id);

  if (!profile) notFound();

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-10 pb-28">
      {/* Identity */}
      <div className="corner-ticks relative bg-card border border-border cut-corner-lg overflow-hidden mb-6">
        <div className="tex-grid absolute inset-0 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 md:p-8">
          <div className="relative w-16 h-16 md:w-24 md:h-24 shrink-0 bg-background border border-border cut-corner overflow-hidden">
            {profile.avatar_url && (
              <Image
                src={profile.avatar_url}
                alt={profile.username}
                fill
                sizes="96px"
                className="object-cover"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50 block mb-1">
              Creator
            </span>
            <h1 className="font-arcade text-2xl md:text-4xl font-black uppercase tracking-wider text-foreground truncate">
              {profile.username}
            </h1>
            <p className="text-xs text-foreground/40 font-sans mt-1">
              Joined {formatSince(profile.createdAt)}
            </p>
          </div>

          {profile.isBanned && (
            <span className="cut-corner border border-battle-red/40 bg-battle-red/10 text-battle-red px-3 py-1.5 font-arcade text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
              <Ban className="w-3 h-3" /> Suspended
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat label="Lifetime earned" value={money(profile.totalEarned)} accent="text-battle-green" icon={<TrendingUp className="w-4 h-4" />} />
        <Stat label="Pool raised" value={money(profile.poolRaised)} accent="text-battle-yellow" icon={<Trophy className="w-4 h-4" />} />
        <Stat label="Arenas hosted" value={String(profile.arenasCreated)} icon={<Swords className="w-4 h-4" />} />
        <Stat label="Settled" value={String(profile.arenasSettled)} />
      </div>

      {/* Arenas */}
      <h2 className="font-arcade text-sm md:text-base font-bold uppercase tracking-widest text-foreground mb-4">
        Arenas hosted
      </h2>

      {profile.arenas.length === 0 ? (
        <div className="corner-ticks relative border border-dashed border-border cut-corner py-12 text-center overflow-hidden">
          <div className="tex-hatch absolute inset-0 pointer-events-none" />
          <p className="relative font-arcade text-xs uppercase tracking-widest text-foreground/40">
            No arenas hosted yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profile.arenas.map((arena) => (
            <Link
              key={arena.id}
              href={`/${arena.room_type === "global" ? "global" : "battle"}/${arena.id}`}
              className="pressable hover-lift group flex items-center justify-between gap-3 bg-card
                         border border-border cut-corner p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Leading contender fronts the card. */}
                <span className="relative w-12 h-12 shrink-0 cut-corner overflow-hidden bg-background border border-border">
                  {arena.leader?.image_url ? (
                    <Image
                      src={arena.leader.image_url}
                      alt={arena.leader.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <span
                      className="w-full h-full flex items-center justify-center font-arcade text-base font-bold text-black"
                      style={{ backgroundColor: arena.leader?.brand_color ?? "#FF7A00" }}
                    >
                      {(arena.leader?.name ?? arena.title).charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span
                    className="absolute bottom-0 inset-x-0 h-1"
                    style={{ backgroundColor: arena.leader?.brand_color ?? "#FF7A00" }}
                  />
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        arena.status === "active" ? "bg-battle-green animate-pulse" : "bg-foreground/20"
                      }`}
                    />
                    <span className="font-arcade text-[9px] uppercase tracking-widest text-foreground/40">
                      {arena.status} · {arena.room_type}
                    </span>
                  </div>
                  <span className="font-arcade text-sm font-bold text-foreground truncate block group-hover:text-primary transition-colors">
                    {arena.title}
                  </span>
                  {arena.leader && (
                    <span className="text-[10px] text-foreground/35 font-sans truncate block">
                      {arena.status === "settled" ? "Won by" : "Leading"} {arena.leader.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-arcade text-sm font-bold text-battle-yellow tabular-nums">
                  {money(arena.total_pool)}
                </span>
                <ArrowUpRight className="w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "text-foreground",
  icon,
}: {
  label: string;
  value: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="corner-ticks relative bg-card border border-border cut-corner p-4 overflow-hidden">
      <div className="tex-dots absolute inset-0 pointer-events-none" />
      <div className="relative flex items-start justify-between gap-2">
        <span className="font-arcade text-[9px] uppercase tracking-widest text-foreground/50">
          {label}
        </span>
        {icon && <span className="text-foreground/25 shrink-0">{icon}</span>}
      </div>
      <p className={`relative mt-2 font-arcade text-xl md:text-2xl font-black tabular-nums ${accent}`}>
        {value}
      </p>
    </div>
  );
}
