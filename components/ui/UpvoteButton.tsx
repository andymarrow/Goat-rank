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
}

export default function UpvoteButton({
  initialCount,
  voteId,
  initialUpvoted = false,
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
    setUpvoted(next);
    setCount((prev) => Math.max(prev + (next ? 1 : -1), 0));

    if (next) {
      const newClick = { id: Date.now() + Math.random() };
      setClicks((prev) => [...prev, newClick]);
      setTimeout(() => setClicks((prev) => prev.filter((c) => c.id !== newClick.id)), 1000);
    }

    const result = await toggleTestimonialUpvote(voteId);

    if (!result.success) {
      // Roll back.
      setUpvoted(!next);
      setCount((prev) => Math.max(prev + (next ? -1 : 1), 0));
    } else if (typeof result.upvoted === "boolean" && result.upvoted !== next) {
      // Server disagreed (e.g. a raced duplicate) — trust the server.
      setUpvoted(result.upvoted);
      setCount((prev) => Math.max(prev + (result.upvoted ? 1 : -1) - (next ? 1 : -1), 0));
    }

    setIsUpdating(false);
  }, [voteId, isUpdating, upvoted]);

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
              className="absolute bottom-0 left-1/2 -translate-x-1/2 font-arcade font-bold text-primary text-lg drop-shadow-md"
            >
              +1
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.button
        whileTap={{ scale: 0.9, y: 2 }}
        onClick={handleUpvote}
        disabled={isUpdating}
        aria-pressed={upvoted}
        aria-label={upvoted ? "Remove your upvote" : "Upvote this battle cry"}
        title={upvoted ? "You upvoted this — click to undo" : "Upvote"}
        className={`flex items-center gap-2 px-3 py-1.5 cut-corner border transition-colors group
          select-none disabled:opacity-60 ${
            upvoted
              ? "bg-primary/10 border-primary/50 text-primary"
              : "bg-background border-border text-foreground/60 hover:border-primary hover:text-primary"
          }`}
      >
        <ArrowBigUp
          className={`w-4 h-4 transition-transform ${
            upvoted ? "fill-current -translate-y-px" : "group-hover:-translate-y-0.5"
          }`}
        />
        <span className="font-arcade text-sm font-bold tabular-nums">{count}</span>
      </motion.button>
    </div>
  );
}
