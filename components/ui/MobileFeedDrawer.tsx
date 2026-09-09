"use client";

import { useEffect, useState } from "react";
import { MessageSquare, X, HeartHandshake } from "lucide-react";

import FeedList from "@/components/ui/FeedList";
import CharityVote from "@/components/ui/CharityVote";
import type { FeedItem } from "@/lib/feed";
import type { CharityTally } from "@/actions/charityVote";
import type { Charity } from "@/actions/admin/config";

/**
 * Mobile slide-over for an arena's battle cries and charity vote.
 *
 * Shared by 1v1 and global rooms. The trigger is a floating button on the
 * right rather than a bar across the top — the arena header already holds the
 * back link, countdown and charity chip, and a centred trigger sat on top of
 * them.
 */
export default function MobileFeedDrawer({
  roomId,
  feed,
  feedCursor,
  feedHasMore,
  charities,
  charityTally,
  charityChoice,
  charityTotal,
  onLeaderChange,
  bottomOffset = "bottom-36",
}: {
  roomId: string;
  feed: FeedItem[];
  feedCursor: string | null;
  feedHasMore: boolean;
  charities: Charity[];
  charityTally: CharityTally[];
  charityChoice: string | null;
  charityTotal: number;
  /** Passed through so the arena's charity card can rename itself instantly. */
  onLeaderChange?: (leader: CharityTally | null) => void;
  /** Lifts the trigger clear of whatever the page pins to the bottom. */
  bottomOffset?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"feed" | "charity">("feed");

  // A drawer that leaves the page scrolling underneath feels broken on touch.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open live feed"
        className={`lg:hidden pressable fixed right-3 ${bottomOffset} z-40 w-12 h-12 rounded-full
                    bg-primary text-primary-foreground shadow-[0_6px_18px_rgba(255,122,0,0.45)]
                    flex items-center justify-center active:scale-95 transition-transform`}
      >
        <MessageSquare className="w-5 h-5" />
        {feed.length > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-background
                       border border-primary text-primary font-arcade text-[10px] font-bold
                       flex items-center justify-center tabular-nums"
          >
            {feed.length > 99 ? "99+" : feed.length}
          </span>
        )}
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <button
            aria-label="Close live feed"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Live feed"
            className="relative ml-auto w-[92%] max-w-sm h-full bg-card border-l border-border
                       flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
                  LIVE FEED
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted border border-border/60 text-[10px] font-mono font-bold text-primary shadow-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>LIVE</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="pressable text-foreground/50 hover:text-foreground transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-5">
              {/* Feed List */}
              <FeedList
                roomId={roomId}
                initialItems={feed}
                initialCursor={feedCursor}
                initialHasMore={feedHasMore}
                compact
                emptyMessage="Be the first to speak"
              />

              {/* Charity Section */}
              {charities && charities.length > 0 && (
                <div className="mt-auto pt-3 border-t border-border/60 flex flex-col gap-2.5">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                    Charity Allocation
                  </span>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3 shadow-xs">
                    <CharityVote
                      onLeaderChange={onLeaderChange}
                      roomId={roomId}
                      charities={charities}
                      tally={charityTally}
                      myChoice={charityChoice}
                      total={charityTotal}
                    />
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
