import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Swords, TrendingUp, Trophy, ArrowUpRight, Ban, Zap, MessageSquare } from "lucide-react";

import { getUserProfile } from "@/actions/getUserProfile";
import { formatSince } from "@/lib/time";
import { DemoDot } from "@/components/ui/DemoBadge";
import Avatar from "@/components/ui/Avatar";
import { absolute, breadcrumbSchema, jsonLd } from "@/lib/seo";

/**
 * A person's page ranks for their display name, and states in its description
 * what they have actually done here, since "user profile" ranks for nothing.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getUserProfile(id);

  if (!profile) return { title: "Profile not found", robots: { index: false } };

  const hosted = profile.arenasCreated > 0;

  const description = hosted
    ? `${profile.username} has hosted ${profile.arenasCreated} arena${
        profile.arenasCreated === 1 ? "" : "s"
      } on GOAT Rank, raising ${money(profile.poolRaised)} in pledges.`
    : `${profile.username} has backed ${profile.arenasBacked} arena${
        profile.arenasBacked === 1 ? "" : "s"
      } on GOAT Rank with ${money(profile.totalPledged)} in pledges.`;

  return {
    title: profile.username,
    description,
    alternates: { canonical: absolute(`/u/${id}`) },
    openGraph: {
      title: `${profile.username} on GOAT Rank`,
      description,
      type: "profile",
      url: absolute(`/u/${id}`),
    },
    // A seeded account is real content but not a page worth ranking, and
    // indexing personas would put invented people into search results.
    ...(profile.isBot ? { robots: { index: false, follow: true } } : {}),
  };
}

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

  // Bots never host, so their profile is about participation.
  const isHost = profile.arenasCreated > 0;

  const shown = isHost
    ? profile.arenas
    : profile.backed.map((b) => ({
        id: b.id,
        title: b.title,
        room_type: b.room_type,
        status: b.status,
        total_pool: b.pledged,
        leader: null as null | { name: string; image_url: string | null; brand_color: string | null },
      }));

  return (
    <div className="w-full max-w-[1200px] mx-auto md:px-8 py-6 md:py-10 pb-28">
      {/* Identity */}
      <div className="relative bg-card border border-border/60 rounded-2xl overflow-hidden mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 md:p-8">
          <Avatar
            src={profile.avatar_url}
            name={profile.username}
            size={96}
            className="!w-16 !h-16 md:!w-24 md:!h-24 !rounded-2xl"
          />

          <div className="w-full min-w-0 flex-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
              {isHost ? "Creator" : "Supporter"}
            </span>

            <h1 className="flex items-center gap-2.5 text-2xl md:text-4xl font-extrabold tracking-tight text-foreground">
              <span className="truncate">{profile.username}</span>
              {/* Seeded account. The dot is the disclosure — its tooltip says
                  what it means, so no label is needed beside it. */}
              {profile.isBot && <DemoDot className="!w-2.5 !h-2.5" />}
            </h1>

            <p className="text-xs text-muted-foreground font-sans mt-1">
              Joined {formatSince(profile.createdAt)}
            </p>
          </div>

          {profile.isBanned && (
            <span
              className="rounded-full border border-red-500/40 bg-red-500/10 text-red-500 px-3 py-1.5
                         font-mono text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              <Ban className="w-3 h-3" /> Suspended
            </span>
          )}
        </div>
      </div>

      {/* Stats. A host and a supporter are different things — show whichever
          this account actually is rather than four zeros. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {isHost ? (
          <>
            <Stat
              label="Lifetime earned"
              value={money(profile.totalEarned)}
              accent="text-emerald-500"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <Stat
              label="Pool raised"
              value={money(profile.poolRaised)}
              accent="text-amber-500"
              icon={<Trophy className="w-4 h-4" />}
            />
            <Stat
              label="Arenas hosted"
              value={String(profile.arenasCreated)}
              icon={<Swords className="w-4 h-4" />}
            />
            <Stat label="Settled" value={String(profile.arenasSettled)} />
          </>
        ) : (
          <>
            <Stat
              label="Total backed"
              value={money(profile.totalPledged)}
              accent="text-amber-500"
              icon={<Zap className="w-4 h-4" />}
            />
            <Stat
              label="Arenas backed"
              value={String(profile.arenasBacked)}
              icon={<Swords className="w-4 h-4" />}
            />
            <Stat
              label="Battle cries"
              value={String(profile.criesPosted)}
              icon={<MessageSquare className="w-4 h-4" />}
            />
            <Stat
              label="Member since"
              value={formatSince(profile.createdAt).replace(" ago", "")}
            />
          </>
        )}
      </div>

      {/* Arenas */}
      <h2 className="font-mono text-xs md:text-sm font-bold uppercase tracking-wider text-foreground mb-4">
        {isHost ? "Arenas hosted" : "Arenas backed"}
      </h2>

      {shown.length === 0 ? (
        <div className="border border-dashed border-border/60 rounded-2xl py-12 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {isHost ? "No arenas hosted yet" : "Hasn't backed an arena yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shown.map((arena) => (
            <Link
              key={arena.id}
              href={`/${arena.room_type === "global" ? "global" : "battle"}/${arena.id}`}
              className="group flex items-center justify-between gap-3 bg-card border border-border/60
                         rounded-2xl p-4 hover:border-primary/50 transition-colors shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={arena.leader?.image_url}
                  name={arena.leader?.name ?? arena.title}
                  size={48}
                  color={arena.leader?.brand_color}
                  className="!rounded-xl"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        arena.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                      }`}
                    />
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {arena.status} · {arena.room_type}
                    </span>
                  </div>

                  <span className="font-bold text-sm text-foreground truncate block group-hover:text-primary transition-colors">
                    {arena.title}
                  </span>

                  {arena.leader && (
                    <span className="text-[11px] text-muted-foreground font-sans truncate block">
                      {arena.status === "settled" ? "Won by" : "Leading"} {arena.leader.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-sm text-amber-500 tabular-nums">
                  {money(arena.total_pool)}
                </span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
    <div className="relative bg-card border border-border/60 rounded-2xl p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      </div>
      <p className={`mt-2 text-xl md:text-2xl font-extrabold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}
