"use client";

import Image from "next/image";
import { MessageSquare, Zap } from "lucide-react";
import UpvoteButton from "@/components/ui/UpvoteButton";
import { formatSince } from "@/lib/time";

export type FeedEntry = {
  id: string;
  amount: number;
  voter_name: string;
  voter_avatar: string | null;
  message: string | null;
  upvote_count: number;
  created_at: string;
  backing: string | null;
};

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

/**
 * Public battle cries for a global arena.
 *
 * Global rooms reuse the battle VoteModal, which collects a paid message, but
 * nothing here ever displayed them — voters were paying for a comment that
 * went straight into the database and nowhere else.
 */
export default function GlobalFeed({ feed }: { feed: FeedEntry[] }) {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 md:px-0 py-10">
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="font-arcade text-lg md:text-xl font-bold uppercase tracking-widest text-foreground">
          Battle cries
        </h2>
        <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/40">
          {feed.length} paid
        </span>
      </div>

      {feed.length === 0 ? (
        <div className="corner-ticks relative border border-dashed border-border cut-corner py-12 text-center overflow-hidden">
          <div className="tex-hatch absolute inset-0 pointer-events-none" />
          <p className="relative font-arcade text-xs uppercase tracking-widest text-foreground/40">
            No battle cries yet
          </p>
          <p className="relative mt-2 text-sm text-foreground/35 font-sans">
            Back a contender and your message lands here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {feed.map((entry) => (
            <li
              key={entry.id}
              className="corner-ticks relative flex gap-3 p-4 bg-card border border-border cut-corner overflow-hidden"
            >
              <div className="tex-dots absolute inset-0 pointer-events-none" />

              <div className="relative w-10 h-10 shrink-0 bg-background border border-border cut-corner overflow-hidden">
                {entry.voter_avatar && (
                  <Image
                    src={entry.voter_avatar}
                    alt={entry.voter_name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="relative min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-arcade text-xs font-bold text-foreground">
                    {entry.voter_name}
                  </span>

                  <span className="cut-corner border border-primary/40 bg-primary/10 text-primary px-2 py-0.5 font-arcade text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" fill="currentColor" />
                    {money(entry.amount)}
                  </span>

                  {entry.backing && (
                    <span className="font-arcade text-[10px] uppercase tracking-widest text-foreground/45">
                      backed {entry.backing}
                    </span>
                  )}

                  <span className="text-[10px] text-foreground/30 font-sans ml-auto">
                    {formatSince(entry.created_at)}
                  </span>
                </div>

                <p className="text-sm text-foreground/80 font-sans leading-relaxed break-words">
                  {entry.message}
                </p>

                <div className="mt-2">
                  <UpvoteButton initialCount={entry.upvote_count} voteId={entry.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
