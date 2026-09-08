"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  Trophy,
  Timer,
  Users,
  Heart,
  Crown,
  UserPlus,
  Search,
  MessageSquare,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  X,
  Check,
  Hash,
  ArrowUpDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AddContenderModal from "./AddContenderModal";
import VoteModal from "@/app/battle/[slug]/_components/VoteModal";
import FeedList from "@/components/ui/FeedList";
import MobileFeedDrawer from "@/components/ui/MobileFeedDrawer";
import CharityVote from "@/components/ui/CharityVote";
import CharityCard from "@/components/ui/CharityCard";
import LivePresence from "@/components/ui/LivePresence";
import DropdownPanel from "@/components/ui/DropdownPanel";
import Countdown from "@/components/ui/Countdown";

export default function GlobalRoomClient({ initialRoomData }: { initialRoomData: any }) {
  const [roomData, setRoomData] = useState(initialRoomData);
  const [sortBy, setSortBy] = useState<"rank" | "votes" | "name">("rank");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [selectedContenderIndex, setSelectedContenderIndex] = useState(0);

  // Filter & sort rankings based solely on real DB fetched data
  const processedRankings = useMemo(() => {
    let list = [...(roomData.rankings || [])];

    if (search.trim()) {
      list = list.filter((p: any) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "votes") {
      list.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    } else {
      list.sort((a, b) => (a.rank || 0) - (b.rank || 0));
    }

    return list;
  }, [roomData.rankings, search, sortBy]);

  const poolTotalSum = useMemo(() => {
    const sum = (roomData.rankings || []).reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0);
    return sum > 0 ? sum : (roomData.totalPool || 1);
  }, [roomData]);

  const handleVoteClick = (entityId: string) => {
    const actualIndex = roomData.rankings.findIndex((r: any) => r.id === entityId);
    setSelectedContenderIndex(actualIndex >= 0 ? actualIndex : 0);
    setIsVoteModalOpen(true);
  };

  const syntheticBattleForModal = {
    id: roomData.id,
    charity: roomData.charity,
    contenders: roomData.rankings.map((r: any) => ({
      id: r.contender_id,
      name: r.name,
      color: r.color,
      image: r.img
    }))
  };

  return (
    <div className="w-full mx-auto py-4 sm:py-6 lg:py-8 bg-background text-foreground font-sans min-h-screen">

      {/* =========================================================================
          SIDE-BY-SIDE ARENA LAYOUT (LEFT INFO BANNER CARD + RIGHT CONTENDER GRID)
      ========================================================================= */}
      {/* items-start only from lg: on a phone this is a column, where it
          shrink-wraps each child to its content instead of the screen width. */}
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-stretch lg:items-start">

        {/* LEFT COLUMN: ARENA INFO & BANNER SECTION (Refined sidebar width + Vertical Separator) */}
        <div className="w-full lg:w-[22vw] xl:w-[22vw] shrink-0 lg:sticky lg:top-20 flex flex-col gap-5 lg:pr-6 lg:border-r lg:border-border/40">

          {/* Main Info Card Wrapper */}
          <div className="relative w-full rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm flex flex-col gap-4 overflow-hidden">
            {/* Cover Image Box */}
            <div className="relative w-full h-[170px] sm:h-[185px] rounded-xl overflow-hidden bg-muted/60 border border-border/50 shrink-0">
              {roomData.image ? (
                <Image
                  src={roomData.image}
                  alt={roomData.title}
                  fill
                  priority
                  sizes="380px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <Globe className="w-10 h-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

              {/* Category Pill */}
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/80 border border-white/10 text-[10px] sm:text-xs font-medium">
                  {roomData.category || "Global Arena"}
                </span>
              </div>

              {/* Current Leader Chip */}
              {roomData.leader && (
                <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white font-semibold text-xs border border-white/10 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative w-5 h-5 rounded-md overflow-hidden bg-muted shrink-0">
                      {roomData.leader.img ? (
                        <Image src={roomData.leader.img} alt={roomData.leader.name} fill className="object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-bold text-[9px] text-black"
                          style={{ backgroundColor: roomData.leader.color || "#FF7A00" }}
                        >
                          {roomData.leader.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="truncate text-xs">
                      <span className="text-yellow-500 font-bold">👑 #1</span> {roomData.leader.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-yellow-500 font-sans font-semibold shrink-0 ml-2">
                    ${(Number(roomData.leader.amount) || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Title & Live Status Section */}
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted border border-border/60 text-[10px] font-mono font-bold text-primary shadow-xs w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>LIVE GLOBAL ARENA</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground leading-snug">
                {roomData.title}
              </h1>
            </div>

            {/* Stats Section */}
            <div className="flex flex-col gap-2 text-xs pt-3 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Prize Pool</span>
                </span>
                <span className="font-semibold text-yellow-500 text-sm font-sans">
                  {(roomData.totalPool || 0).toLocaleString()}
                </span>
              </div>

              {roomData.expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Time Left</span>
                  </span>
                  <Countdown target={roomData.expiresAt} size="sm" />
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Active Contenders</span>
                </span>
                <span className="font-semibold text-foreground">
                  {roomData.rankings?.length || 0}
                </span>
              </div>

              {roomData.charity && !roomData.beneficiary && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Charity Allocation</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    30% to {roomData.charity}
                  </span>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 mt-1"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Contender</span>
            </button>

            <div className="flex justify-center pt-1">
              <LivePresence scope={roomData.id} label="watching" />
            </div>
          </div>

          {/* Who the 30% reaches, with their logo and a link out. */}
          {roomData.beneficiary && <CharityCard charity={roomData.beneficiary} />}

          {/* CHARITY ALLOCATION CARD WRAPPER */}
          <div className="relative w-full rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Heart className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Charity Allocation (30%)
              </h3>
            </div>
            <CharityVote
              roomId={roomData.id}
              charities={roomData.charities ?? []}
              tally={roomData.charityTally ?? []}
              myChoice={roomData.charityChoice ?? null}
              total={roomData.charityTotal ?? 0}
            />
          </div>

        </div>

        {/* RIGHT COLUMN: SEARCH & SORT TOOLBAR + CONTENDER CARDS GRID */}
        <div className="w-full flex-1 min-w-0 flex flex-col gap-6">

          {/* TOOLBAR: Search Input, Counter Badge & Professional Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-2xl shadow-sm">

            {/* Search Bar */}
            <div className="relative flex-1 group">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
              <input
                type="text"
                placeholder="Search contenders by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-muted/30 border border-border/60 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-sans"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: Counter Badge & Custom Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">

              {/* Contender Counter Badge */}
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/30 border border-border/50 text-[11px] font-medium text-muted-foreground font-sans select-none">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">{processedRankings.length}</span>
                <span>/ {roomData.rankings?.length || 0}</span>
              </span>

              {/* Custom Sort Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  aria-expanded={isSortOpen}
                  aria-label="Sort contenders"
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer select-none ${isSortOpen
                    ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                    : "bg-muted/40 border-border/60 text-foreground hover:bg-muted hover:border-border active:scale-[0.98]"
                    }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="capitalize font-sans">
                    Sort: <span className="font-bold">{sortBy}</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Click Outside Backdrop */}
                {isSortOpen && (
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsSortOpen(false)}
                    aria-hidden="true"
                  />
                )}

                {/* Dropdown Menu. DropdownPanel keeps it on screen when the
                    toolbar wraps and the trigger is no longer near the edge. */}
                <DropdownPanel open={isSortOpen}>
                  <AnimatePresence>
                    {isSortOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="w-52 max-w-[calc(100vw-1rem)] bg-card border border-border/80 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 backdrop-blur-xl"
                      >
                        {[
                          { id: "rank", label: "Rank (#1 Top)", icon: Hash, desc: "Highest ranked first" },
                          { id: "votes", label: "Pool ($ Highest)", icon: Sparkles, desc: "Most pool votes first" },
                          { id: "name", label: "Alphabetical (A-Z)", icon: ArrowUpDown, desc: "Sorted by contender name" },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const selected = sortBy === opt.id;

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.id as any);
                                setIsSortOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${selected
                                ? "bg-muted/80 text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon className={`w-4 h-4 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold leading-tight truncate">
                                    {opt.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-sans font-normal truncate">
                                    {opt.desc}
                                  </span>
                                </div>
                              </div>
                              {selected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-1 stroke-[2.5]" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </DropdownPanel>
              </div>

            </div>

          </div>

          {/* CONTENDERS GRID (3 Columns - Home Screen Card Aesthetics) */}
          {processedRankings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {processedRankings.map((contender: any) => {
                const totalVotes = Number(contender.amount) || 0;
                const percentage = poolTotalSum > 0 ? Math.round((totalVotes / poolTotalSum) * 100) : 0;
                const isLeader = contender.rank === 1;

                return (
                  <div
                    key={contender.id}
                    className="relative rounded-2xl bg-card border border-border/80 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between gap-3 hover:border-border hover:bg-white/[0.02] transition-all duration-200 ease-out group"
                  >
                    {/* Top Contender Poster Box. A link, as the 1v1 stage
                        already is — a contender's profile was unreachable
                        from the arena that names them. */}
                    <Link
                      href={`/profile/${contender.id}`}
                      aria-label={`View ${contender.name}'s profile`}
                      className="relative w-full h-[150px] sm:h-[160px] rounded-xl overflow-hidden bg-muted/60 border border-border/50 shrink-0 block cursor-pointer"
                    >
                      {contender.img ? (
                        <Image
                          src={contender.img}
                          alt={contender.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 300px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-bold text-xl text-black"
                          style={{ backgroundColor: contender.color || "#FF7A00" }}
                        >
                          {contender.name.charAt(0)}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                    </Link>

                    {/* Contender Details & Progress */}
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/profile/${contender.id}`}
                        className="font-semibold text-foreground text-sm line-clamp-1 tracking-tight hover:text-primary transition-colors cursor-pointer"
                      >
                        {contender.name}
                      </Link>

                      <div className="flex items-center justify-between text-xs font-medium">
                        {/* Dollars, not a vote count — the figure was already
                            money, just printed without its unit. */}
                        <span className="font-semibold text-yellow-500 font-sans">
                          ${totalVotes.toLocaleString()}{" "}
                          <span className="font-normal text-muted-foreground text-[11px]">backed</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {percentage}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isLeader ? "bg-yellow-500" : "bg-primary"
                            }`}
                          style={{ width: `${Math.max(percentage, 3)}%` }}
                        />
                      </div>
                    </div>

                    {/* Vote Action Button */}
                    <button
                      onClick={() => handleVoteClick(contender.id)}
                      className={`w-full py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 mt-1 active:scale-[0.98] ${isLeader
                        ? "bg-primary text-primary-foreground hover:opacity-95"
                        : "bg-muted border border-border/60 text-foreground hover:bg-muted"
                        }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Back {contender.name}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center flex flex-col items-center justify-center gap-3">
              <Users className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">
                No contenders match "{search}"
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="rounded-xl border border-primary text-primary px-5 py-2 font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
              >
                Inject Contender
              </button>
            </div>
          )}

          {/* BOTTOM BATTLE CRIES FEED SECTION
              Desktop only: on mobile the same feed is already in the drawer,
              so rendering it here too showed every battle cry twice. */}
          <div className="hidden lg:flex flex-col gap-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Battle Cries Feed
              </h2>
            </div>

            <FeedList
              roomId={roomData.id}
              initialItems={roomData.feed ?? []}
              initialCursor={roomData.feedCursor ?? null}
              initialHasMore={roomData.feedHasMore ?? false}
            />
          </div>

        </div>

      </div>

      {/* Mobile Feed Drawer */}
      <MobileFeedDrawer
        roomId={roomData.id}
        feed={roomData.feed ?? []}
        feedCursor={roomData.feedCursor ?? null}
        feedHasMore={roomData.feedHasMore ?? false}
        charities={roomData.charities ?? []}
        charityTally={roomData.charityTally ?? []}
        charityChoice={roomData.charityChoice ?? null}
        charityTotal={roomData.charityTotal ?? 0}
        bottomOffset="bottom-24"
      />

      {/* --- MODALS --- */}
      <AddContenderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        roomTitle={roomData.title}
        roomId={roomData.id}
      />

      <VoteModal
        isOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        battle={syntheticBattleForModal}
        contenderIndex={selectedContenderIndex}
      />

    </div>
  );
}