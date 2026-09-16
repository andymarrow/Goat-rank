"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Check, Hand, Info } from "lucide-react";

import { castFreePick, type FreePickState } from "@/actions/freePick";

/**
 * Sentiment, shown next to the money and never mixed with it.
 *
 * Everything else on the site costs at least $3, which leaves a visitor who is
 * not ready to pay with nothing to do but leave. A pick is free, takes one
 * tap, and is stated plainly as having no effect on who wins: the moment
 * people suspect a free vote moves a paid leaderboard, the paying stops making
 * sense.
 *
 * The interesting part is the gap it exposes. "62% are with them, but only 18%
 * of the money is" is the line that gets quoted, and the line that makes
 * somebody reach for their card.
 */
export default function FreePick({
  roomId,
  contenders,
  initial,
  closed = false,
}: {
  roomId: string;
  /** In display order, with the money each is holding. */
  contenders: { id: string; name: string; color: string | null; amount: number }[];
  initial: FreePickState;
  closed?: boolean;
}) {
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const picksFor = (id: string) => state.tally.find((t) => t.contenderId === id)?.picks ?? 0;
  const moneyTotal = contenders.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const pick = (contenderId: string) => {
    if (closed || pending) return;

    const previous = state;

    // Optimistic: the bar moves under the thumb that tapped it.
    setState((s) => {
      const tally = s.tally.filter((t) => t.contenderId !== contenderId);
      const mineWas = s.mine;

      const next = [
        ...tally.map((t) =>
          t.contenderId === mineWas ? { ...t, picks: Math.max(0, t.picks - 1) } : t
        ),
        { contenderId, picks: picksFor(contenderId) + 1 },
      ];

      return {
        ...s,
        mine: contenderId,
        tally: next,
        total: mineWas ? s.total : s.total + 1,
        remaining: mineWas ? s.remaining : Math.max(0, s.remaining - 1),
      };
    });

    setError(null);

    startTransition(async () => {
      const res = await castFreePick(roomId, contenderId);

      if (!res.ok) {
        setState(previous);
        setError(res.error ?? "Could not record that.");
      } else if (typeof res.remaining === "number") {
        setState((s) => ({ ...s, remaining: res.remaining! }));
      }
    });
  };

  const exhausted = state.remaining <= 0 && !state.mine;

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <span className="shrink-0 rounded-xl bg-muted/60 border border-border/60 p-2 text-muted-foreground">
          <Hand className="w-4 h-4" />
        </span>

        <div className="min-w-0 flex-1">
          <span className="block font-bold text-sm text-foreground">Which side are you on?</span>
          <span className="block text-[11px] text-muted-foreground font-sans">
            Free, and counted separately. Picks never move the pool or decide the winner.
          </span>
        </div>

        {state.total > 0 && (
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
            {state.total} pick{state.total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {contenders.map((c) => {
          const picks = picksFor(c.id);
          const sentiment = state.total > 0 ? Math.round((picks / state.total) * 100) : 0;
          const capital = moneyTotal > 0 ? Math.round(((Number(c.amount) || 0) / moneyTotal) * 100) : 0;
          const mine = state.mine === c.id;

          return (
            <button
              key={c.id}
              type="button"
              disabled={closed || pending || (exhausted && !mine)}
              onClick={() => pick(c.id)}
              className={`group w-full rounded-xl border p-2.5 text-left transition-all cursor-pointer
                          disabled:cursor-not-allowed disabled:opacity-60 ${
                            mine
                              ? "border-primary bg-primary/10"
                              : "border-border/60 bg-muted/20 hover:border-border"
                          }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold text-xs text-foreground truncate flex-1 min-w-0">
                  {c.name}
                </span>

                {mine && (
                  <span className="shrink-0 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-primary">
                    <Check className="w-2.5 h-2.5" /> your pick
                  </span>
                )}

                <span className="shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">
                  {sentiment}%
                </span>
              </div>

              {/* Two bars: what people think, and what people paid. The gap is
                  the whole point of showing this. */}
              <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: c.color ?? "#FF7A00" }}
                  animate={{ width: `${Math.max(sentiment, 2)}%` }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                />
              </div>

              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
                  opinion {sentiment}% · money {capital}%
                </span>

                {sentiment > capital + 10 && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-amber-500">
                    underbacked
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-[11px] text-red-500 font-sans">
          {error}
        </p>
      )}

      <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground/80 font-sans">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        <span>
          {closed
            ? "This arena is closed, so picks are locked."
            : exhausted
            ? "You have used your free picks. Backing a contender always counts."
            : `${state.remaining} free pick${state.remaining === 1 ? "" : "s"} left. Only money moves the leaderboard.`}
        </span>
      </p>
    </div>
  );
}
