"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowBigUp } from "lucide-react";
import { toggleTestimonialUpvote } from "@/actions/upvote";

interface UpvoteButtonProps {
  initialCount: number;
  voteId: string;
  /** Whether the current viewer has already upvoted this testimonial. */
  initialUpvoted?: boolean;
  /**
   * Told the new count as it changes, so a list ranked by upvotes can reorder
   * on the spot instead of waiting for a refresh.
   */
  onChange?: (voteId: string, count: number, upvoted: boolean) => void;
}

export default function UpvoteButton({
  initialCount,
  voteId,
  initialUpvoted = false,
  onChange,
}: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [clicks, setClicks] = useState<{ id: number }[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpvote = useCallback(async () => {
    // Guard first. The old version incremented on every click before checking,
    // so a fast clicker could run the counter up on their own.
    if (isUpdating) return;
    setIsUpdating(true);

    const next = !upvoted;

    // Optimistic toggle.
    const optimistic = Math.max(count + (next ? 1 : -1), 0);
    setUpvoted(next);
    setCount(optimistic);
    onChange?.(voteId, optimistic, next);

    if (next) {
      const newClick = { id: Date.now() + Math.random() };
      setClicks((prev) => [...prev, newClick]);
      setTimeout(() => setClicks((prev) => prev.filter((c) => c.id !== newClick.id)), 1000);
    }

    const result = await toggleTestimonialUpvote(voteId);

    if (!result.success) {
      // Roll back.
      const reverted = Math.max(optimistic + (next ? -1 : 1), 0);
      setUpvoted(!next);
      setCount(reverted);
      onChange?.(voteId, reverted, !next);
    } else if (typeof result.upvoted === "boolean" && result.upvoted !== next) {
      // Server disagreed (e.g. a raced duplicate) — trust the server.
      const corrected = Math.max(optimistic + (result.upvoted ? 1 : -1) - (next ? 1 : -1), 0);
      setUpvoted(result.upvoted);
      setCount(corrected);
      onChange?.(voteId, corrected, result.upvoted);
    }

    setIsUpdating(false);
  }, [voteId, isUpdating, upvoted, count, onChange]);

  return (
    <div className="relative flex items-center">
      {/* Floating "+1" Animations */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <AnimatePresence>
          {clicks.map((click) => (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -40, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 font-sans font-extrabold text-primary text-base drop-shadow-md"
            >
              +1
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={handleUpvote}
        disabled={isUpdating}
        aria-pressed={upvoted}
        aria-label={upvoted ? "Remove your upvote" : "Upvote this battle cry"}
        title={upvoted ? "You upvoted this — click to undo" : "Upvote"}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all group
          select-none cursor-pointer disabled:opacity-60 ${
            upvoted
              ? "bg-primary text-primary-foreground border-transparent font-bold shadow-xs"
              : "bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
          }`}
      >
        <ArrowBigUp
          className={`w-3.5 h-3.5 transition-transform ${
            upvoted ? "fill-current -translate-y-px text-primary-foreground" : "group-hover:-translate-y-0.5"
          }`}
        />
        <span className="text-xs font-bold font-sans tabular-nums">{count}</span>
      </motion.button>
    </div>
  );
}
