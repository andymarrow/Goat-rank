"use client";

import { useCallback, useState, useTransition } from "react";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";
import { Zap, Loader2, ChevronDown, MessageSquare } from "lucide-react";

import UpvoteButton from "@/components/ui/UpvoteButton";
import { getRoomFeed } from "@/actions/getFeed";
import type { FeedItem } from "@/lib/feed";
import { formatSince } from "@/lib/time";
import { DemoDot } from "@/components/ui/DemoBadge";

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

  /**
   * Reorder on upvote rather than on refresh.
   *
   * The server ranks the feed by upvotes, so a cry that just overtook its
   * neighbour has to move now — leaving it in place until the next load makes
   * the button look like it did nothing.
   */
  const handleUpvoteChange = useCallback(
    (voteId: string, count: number, upvoted: boolean) => {
      setItems((prev) =>
        [...prev]
          .map((i) => (i.id === voteId ? { ...i, upvote_count: count, upvoted } : i))
          .sort(
            (a, b) =>
              b.upvote_count - a.upvote_count ||
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
      );
    },
    []
  );

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
      <div className="w-full py-6 px-4 text-center rounded-xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center gap-1.5">
        <MessageSquare className="w-4 h-4 text-muted-foreground/30" />
        <p className="text-xs font-medium text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`rounded-2xl border border-border/60 bg-card/40 p-2 sm:p-3 divide-y divide-border/30
                    overflow-y-auto overscroll-contain scrollbar-hide ${
                      compact ? "" : "max-h-[70vh]"
                    }`}
      >
        {items.map((entry) => (
          <div
            key={entry.id}
            className="relative flex items-start gap-2.5 py-2.5 px-1 sm:px-1.5 transition-colors hover:bg-white/[0.02] first:pt-1 last:pb-1"
          >
            {/* The avatar links too: half the people who want a backer's
                profile click the picture, not the name. */}
            {entry.voter_id ? (
              <Link href={`/u/${entry.voter_id}`} aria-label={`View ${entry.voter_name}`}>
                <Avatar src={entry.voter_avatar} name={entry.voter_name} size={24} />
              </Link>
            ) : (
              <Avatar src={entry.voter_avatar} name={entry.voter_name} size={24} />
            )}

            <div className="min-w-0 flex-1 flex flex-col gap-1">
              {/* Header: Author, Badge, Backed entity & Time */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  {/* Disclosure: seeded bot content is marked, never passed
                      off as a real supporter. */}
                  {entry.is_demo && <DemoDot />}

                  {entry.voter_id ? (
                    <Link
                      href={`/u/${entry.voter_id}`}
                      className="font-semibold text-xs text-foreground hover:text-primary transition-colors truncate"
                    >
                      {entry.voter_name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-xs text-foreground truncate">
                      {entry.voter_name}
                    </span>
                  )}

                  <span className="px-1.5 py-0.2 rounded-full bg-muted border border-border/60 text-foreground text-[9px] font-bold inline-flex items-center gap-0.5 shrink-0">
                    <Zap className="w-2.5 h-2.5 fill-current text-muted-foreground" />
                    {money(entry.amount)}
                  </span>

                  {entry.backing && !compact && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      backed <span className="text-foreground/80 font-medium">{entry.backing}</span>
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-muted-foreground shrink-0 font-sans">
                  {formatSince(entry.created_at)}
                </span>
              </div>

              {/* Message Content & Inline Upvote */}
              <div className="flex items-center justify-between gap-2">
                <p className="font-sans leading-relaxed text-foreground/85 text-xs break-words min-w-0 flex-1">
                  {entry.message || <span className="text-muted-foreground/60">No battle cry message</span>}
                </p>

                <div className="shrink-0 ml-2">
                  <UpvoteButton
                    initialCount={entry.upvote_count}
                    voteId={entry.id}
                    initialUpvoted={entry.upvoted}
                    onChange={handleUpvoteChange}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={pending}
          className="w-full py-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted font-medium text-[11px] text-muted-foreground hover:text-foreground transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.99] shadow-xs mt-1"
        >
          {pending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-primary" /> Loading...
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> Load older cries
            </>
          )}
        </button>
      )}

      {!hasMore && items.length > 10 && (
        <p className="text-center text-[10px] text-muted-foreground py-1 font-medium">
          That&apos;s the whole feed
        </p>
      )}
    </div>
  );
}
