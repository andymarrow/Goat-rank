"use client";

import { useState, useTransition } from "react";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";
import { Zap, Loader2, ChevronDown, MessageSquare } from "lucide-react";

import UpvoteButton from "@/components/ui/UpvoteButton";
import { getRoomFeed } from "@/actions/getFeed";
import type { FeedItem } from "@/lib/feed";
import { formatSince } from "@/lib/time";

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

/**
 * Paged battle-cry feed, shared by 1v1 arenas and global rooms.
 *
 * Only the first page is server-rendered; the rest is pulled on demand with a
 * keyset cursor. A popular arena could otherwise ship thousands of paid
 * messages into the initial HTML.
 */
export default function FeedList({
  roomId,
  initialItems,
  initialCursor,
  initialHasMore,
  compact = false,
  emptyMessage = "No battle cries yet",
}: {
  roomId: string;
  initialItems: FeedItem[];
  initialCursor: string | null;
  initialHasMore: boolean;
  /** Narrow layout for the 1v1 sidebar. */
  compact?: boolean;
  emptyMessage?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [pending, startTransition] = useTransition();

  const loadMore = () =>
    startTransition(async () => {
      const page = await getRoomFeed(roomId, cursor);

      // De-duplicate: a vote landing mid-scroll can otherwise arrive twice.
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...page.items.filter((i) => !seen.has(i.id))];
      });

      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    });

  if (items.length === 0) {
    return (
      <div className="corner-ticks relative border border-dashed border-border cut-corner py-10 text-center overflow-hidden">
        <div className="tex-hatch absolute inset-0 pointer-events-none" />
        <MessageSquare className="relative w-5 h-5 mx-auto mb-2 text-foreground/25" />
        <p className="relative font-arcade text-[11px] uppercase tracking-widest text-foreground/40">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {items.map((entry) => (
          <li
            key={entry.id}
            className={`relative flex gap-2.5 border border-border bg-card cut-corner ${
              compact ? "p-2.5" : "p-3 md:p-4"
            }`}
          >
            <Avatar
              src={entry.voter_avatar}
              name={entry.voter_name}
              size={compact ? 28 : 38}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                {/* Votes now carry voter_id, so the name links to a real person. */}
                {entry.voter_id ? (
                  <Link
                    href={`/u/${entry.voter_id}`}
                    className="font-arcade text-[11px] font-bold text-foreground hover:text-primary transition-colors truncate"
                  >
                    {entry.voter_name}
                  </Link>
                ) : (
                  <span className="font-arcade text-[11px] font-bold text-foreground truncate">
                    {entry.voter_name}
                  </span>
                )}

                <span className="cut-corner border border-primary/40 bg-primary/10 text-primary px-1.5 py-0.5 font-arcade text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1 shrink-0">
                  <Zap className="w-2.5 h-2.5" fill="currentColor" />
                  {money(entry.amount)}
                </span>

                {entry.backing && !compact && (
                  <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/45 truncate">
                    backed {entry.backing}
                  </span>
                )}

                <span className="text-[10px] text-foreground/30 font-sans ml-auto shrink-0">
                  {formatSince(entry.created_at)}
                </span>
              </div>

              <p
                className={`font-sans leading-relaxed break-words text-foreground/80 ${
                  compact ? "text-[11px]" : "text-xs md:text-sm"
                }`}
              >
                {entry.message}
              </p>

              <div className="mt-1.5">
                <UpvoteButton
                  initialCount={entry.upvote_count}
                  voteId={entry.id}
                  initialUpvoted={entry.upvoted}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={pending}
          className="pressable w-full cut-corner border border-border bg-background py-2.5
                     font-arcade text-[10px] font-bold uppercase tracking-widest text-foreground/60
                     hover:text-foreground hover:border-foreground/40 transition-colors
                     inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Load older cries
            </>
          )}
        </button>
      )}

      {!hasMore && items.length > 10 && (
        <p className="text-center font-arcade text-[9px] uppercase tracking-widest text-foreground/25 py-2">
          That&apos;s the whole feed
        </p>
      )}
    </div>
  );
}
