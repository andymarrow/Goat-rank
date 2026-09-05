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
              <span className="font-arcade text-xs font-bold uppercase tracking-widest text-foreground">
                Live feed
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="pressable text-foreground/50 hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-border shrink-0">
              {(["feed", "charity"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  aria-current={tab === t ? "page" : undefined}
                  className={`flex-1 py-2.5 font-arcade text-[10px] font-bold uppercase tracking-widest
                    transition-colors inline-flex items-center justify-center gap-1.5 ${
                      tab === t
                        ? "text-primary border-b-2 border-primary -mb-px"
                        : "text-foreground/40 hover:text-foreground/70"
                    }`}
                >
                  {t === "feed" ? (
                    <>
                      <MessageSquare className="w-3.5 h-3.5" /> Cries
                    </>
                  ) : (
                    <>
                      <HeartHandshake className="w-3.5 h-3.5" /> Charity
                    </>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-3">
              {tab === "feed" ? (
                <FeedList
                  roomId={roomId}
                  initialItems={feed}
                  initialCursor={feedCursor}
                  initialHasMore={feedHasMore}
                  compact
                  emptyMessage="Be the first to speak"
                />
              ) : (
                <CharityVote
                  roomId={roomId}
                  charities={charities}
                  tally={charityTally}
                  myChoice={charityChoice}
                  total={charityTotal}
                />
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
