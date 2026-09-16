"use client";

import { useState, useEffect } from "react";
import BattleArena from "./BattleArena";
import BattleChat from "./BattleChat";
import VoteModal from "./VoteModal";
import { createClient } from "@/utils/supabase/client"; // <-- Import the client!
import { onBrand } from "@/lib/color";
import CharityCard, { type Beneficiary } from "@/components/ui/CharityCard";
import ArenaResult from "@/components/ui/ArenaResult";
import FreePick from "@/components/ui/FreePick";
import HostTeaser from "@/components/ui/HostTeaser";
import { isArenaClosed } from "@/lib/arena";
import MobileFeedDrawer from "@/components/ui/MobileFeedDrawer";

export default function BattleClient({ initialBattleData }: { initialBattleData: any }) {
  const [battleData, setBattleData] = useState(initialBattleData);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // The card names the leading nomination, so nominating renames it here in
  // the same click rather than on the next load.
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(
    battleData.beneficiary ?? null
  );

  // Decided once per render from the same helper the server uses, so the page
  // and the checkout action can never disagree about whether this is over.
  const closed = isArenaClosed(battleData.expiresAt, battleData.status);

  const handleLeaderChange = (leader: { charity_id: string; charity_name: string; logo_url: string | null } | null) =>
    setBeneficiary((current) =>
      leader
        ? {
            ...(battleData.charities ?? []).find((c: { id: string }) => c.id === leader.charity_id),
            id: leader.charity_id,
            name: leader.charity_name,
            logo_url: leader.logo_url,
            leading: true,
          }
        : battleData.beneficiary ?? current
    );
  const [selectedContender, setSelectedContender] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    if (!battleData?.id) return;

    // Create a Realtime Channel for this specific room
    const channel = supabase
      .channel(`room:${battleData.id}`)

      // 1. Listen for updates to the Contenders' scores
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "room_contenders",
          filter: `room_id=eq.${battleData.id}`,
        },
        (payload) => {
          setBattleData((prev: any) => {
            const updatedContenders = prev.contenders.map((c: any) =>
              c.id === payload.new.id ? { ...c, amount: payload.new.current_votes } : c
            );

            // The pool is the sum of the sides, so it moves with them. Without
            // this the percentages shifted while the headline figure sat
            // still, which reads as a bug rather than as money arriving.
            const totalPool = updatedContenders.reduce(
              (sum: number, c: any) => sum + (Number(c.amount) || 0),
              0
            );

            return { ...prev, contenders: updatedContenders, totalPool };
          });
        }
      )

      // 2. Listen for new Votes in the Chat
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `room_id=eq.${battleData.id}`,
        },
        (payload) => {
          const vote = payload.new as {
            id: string;
            amount: number;
            voter_name: string;
            voter_avatar: string | null;
            voter_id: string | null;
            message: string | null;
            created_at: string;
            contender_id: string;
            is_demo: boolean;
          };

          setBattleData((prev: any) => {
            // Into the feed the sidebar actually renders, not only the legacy
            // recentVotes array nothing reads any more.
            const entry = {
              id: vote.id,
              amount: Number(vote.amount) || 0,
              voter_name: vote.voter_name,
              voter_avatar: vote.voter_avatar,
              voter_id: vote.voter_id,
              message: vote.message,
              upvote_count: 0,
              created_at: vote.created_at,
              backing:
                prev.contenders?.find((c: any) => c.id === vote.contender_id)?.name ?? null,
              upvoted: false,
              is_demo: Boolean(vote.is_demo),
            };

            const already = (prev.feed ?? []).some((f: any) => f.id === entry.id);

            return {
              ...prev,
              recentVotes: [vote, ...(prev.recentVotes ?? [])],
              feed: already ? prev.feed : [entry, ...(prev.feed ?? [])],
            };
          });
        }
      )
      .subscribe();

    // Cleanup subscription when the user leaves the page
    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleData.id, supabase]);

  const handleVoteClick = (contenderIndex: number) => {
    setSelectedContender(contenderIndex);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="w-full max-w-[1600px] mx-auto py-3 sm:py-5 md:p-6 pb-28 lg:pb-6 flex flex-col lg:flex-row gap-6 items-stretch lg:items-start">
        {/* Center Main Arena Column */}
        <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
          {/* A closed contest is not a broken live one: the result replaces
              the stage rather than greying out its buttons. */}
          {closed ? (
            <ArenaResult
              roomId={battleData.id}
              roomType="1v1"
              title={battleData.title}
              status={battleData.status ?? "active"}
              expiresAt={battleData.expiresAt}
              totalPool={Number(battleData.totalPool) || 0}
              charity={beneficiary}
              contenders={(battleData.contenders ?? []).map(
                (c: {
                  name: string;
                  amount: number;
                  image: string | null;
                  color: string | null;
                  entityId?: string;
                }) => ({
                  name: c.name,
                  amount: Number(c.amount) || 0,
                  image: c.image,
                  color: c.color,
                  entityId: c.entityId ?? null,
                })
              )}
            />
          ) : (
            <BattleArena battle={battleData} onVoteClick={handleVoteClick} />
          )}

          {/* Somewhere to take part without paying. Kept below the stage so
              the paid action stays the primary one. */}
          {battleData.freePicks && (battleData.contenders?.length ?? 0) >= 2 && (
            <FreePick
              roomId={battleData.id}
              closed={closed}
              initial={battleData.freePicks}
              contenders={(battleData.contenders ?? []).map(
                (c: { id: string; name: string; color: string | null; amount: number }) => ({
                  id: c.id,
                  name: c.name,
                  color: c.color,
                  amount: Number(c.amount) || 0,
                })
              )}
            />
          )}

          {/* Who the 30% actually reaches. A name on its own asked people to
              pledge to something they may not recognise. */}
          {beneficiary && <CharityCard charity={beneficiary} />}

          <HostTeaser pool={Number(battleData.totalPool) || 0} arenaTitle={battleData.title} />
        </div>

        {/* Right Sidebar Column */}
        <div className="hidden lg:flex w-full lg:w-[380px] xl:w-[420px] flex-col shrink-0 sticky top-20 h-[calc(100vh-100px)]">
          <BattleChat
            battle={battleData}
            onVoteClick={handleVoteClick}
            onLeaderChange={handleLeaderChange}
          />
        </div>
      </div>

      {/* Mobile feed + charity, as a slide-over. The trigger floats clear of
          the arena header, which already holds the back link and countdown. */}
      <MobileFeedDrawer
        roomId={battleData.id}
        feed={battleData.feed ?? []}
        feedCursor={battleData.feedCursor ?? null}
        feedHasMore={battleData.feedHasMore ?? false}
        charities={battleData.charities ?? []}
        charityTally={battleData.charityTally ?? []}
        charityChoice={battleData.charityChoice ?? null}
        charityTotal={battleData.charityTotal ?? 0}
        onLeaderChange={handleLeaderChange}
      />

      {/* Mobile vote bar. Sits directly above the 64px tab bar and respects the
          home-indicator inset; long contender names truncate instead of
          forcing the two buttons to different heights. */}
      {/* Mobile vote bar */}
      {!closed && (
      <div
        className="lg:hidden fixed bottom-16 inset-x-0 bg-card/95 backdrop-blur-xl border-t border-border/80 px-3 py-2.5 z-[52] flex gap-2.5 shadow-2xl"
        style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
      >
        {[0, 1].map((i) => {
          const leftAmt = Number(battleData.contenders[0]?.amount) || 0;
          const rightAmt = Number(battleData.contenders[1]?.amount) || 0;
          const isWinning = i === 0 ? leftAmt >= rightAmt : rightAmt >= leftAmt;

          return (
            <button
              key={i}
              onClick={() => handleVoteClick(i)}
              className={`flex-1 min-w-0 rounded-xl py-3 px-2.5 font-arcade font-bold text-xs shadow-md flex items-center justify-center gap-1 uppercase transition-all active:scale-[0.98] cursor-pointer ${isWinning
                ? "bg-primary text-primary-foreground hover:opacity-95"
                : "bg-muted border border-border/60 text-foreground hover:bg-muted"
                }`}
            >
              <span className="opacity-90 shrink-0">Vote</span>
              <span className="truncate">{battleData.contenders[i].name}</span>
            </button>
          );
        })}
      </div>
      )}

      <VoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        battle={battleData}
        contenderIndex={selectedContender}
        charityName={beneficiary?.name ?? null}
      />
    </>
  );
}