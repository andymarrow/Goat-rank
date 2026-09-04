"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { HeartHandshake, Check, Loader2 } from "lucide-react";

import { setCharityPreference, type CharityTally } from "@/actions/charityVote";
import type { Charity } from "@/actions/admin/config";

/**
 * Charity preference for an arena.
 *
 * Every arena's 30% has to reach a cause even when the winner never claims
 * one. Rather than letting that default silently, the room's participants
 * choose — and can see the running tally while the arena is live.
 */
export default function CharityVote({
  roomId,
  charities,
  tally,
  myChoice,
  total,
  closed = false,
}: {
  roomId: string;
  charities: Charity[];
  tally: CharityTally[];
  myChoice: string | null;
  total: number;
  closed?: boolean;
}) {
  const [choice, setChoice] = useState(myChoice);
  const [counts, setCounts] = useState(tally);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const votesFor = (id: string) => counts.find((t) => t.charity_id === id)?.votes ?? 0;
  const runningTotal = counts.reduce((sum, t) => sum + Number(t.votes || 0), 0) || total;

  const pick = (charityId: string) =>
    startTransition(async () => {
      setError(null);
      const previous = choice;

      // Optimistic: move one vote from the old pick to the new one.
      setChoice(charityId);
      setCounts((prev) => {
        const next = prev.map((t) => ({ ...t }));
        const add = next.find((t) => t.charity_id === charityId);

        if (add) add.votes = Number(add.votes) + 1;
        else {
          const c = charities.find((x) => x.id === charityId);
          if (c) {
            next.push({
              charity_id: c.id,
              charity_name: c.name,
              logo_url: c.logo_url,
              votes: 1,
            });
          }
        }

        if (previous) {
          const drop = next.find((t) => t.charity_id === previous);
          if (drop) drop.votes = Math.max(Number(drop.votes) - 1, 0);
        }

        return next.sort((a, b) => Number(b.votes) - Number(a.votes));
      });

      const res = await setCharityPreference(roomId, charityId);

      if (!res.ok) {
        setChoice(previous);
        setCounts(tally);
        setError(res.error ?? "Could not save that.");
      }
    });

  const active = charities.filter((c) => c.is_active);

  if (active.length === 0) {
    return (
      <p className="text-xs text-foreground/40 font-sans text-center py-6">
        No charities are registered yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <HeartHandshake className="w-4 h-4 text-battle-pink shrink-0 mt-0.5" />
        <p className="text-[11px] text-foreground/55 font-sans leading-relaxed">
          30% of this arena goes to charity. If the winner doesn&apos;t nominate a cause, the one
          with the most votes here receives it.
          {runningTotal > 0 && (
            <span className="text-foreground/35"> {runningTotal} vote{runningTotal === 1 ? "" : "s"} so far.</span>
          )}
        </p>
      </div>

      <ul className="flex flex-col gap-1.5">
        {active.map((c) => {
          const votes = Number(votesFor(c.id));
          const pct = runningTotal > 0 ? (votes / runningTotal) * 100 : 0;
          const mine = choice === c.id;

          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={closed || pending}
                onClick={() => pick(c.id)}
                aria-pressed={mine}
                className={`pressable relative w-full overflow-hidden flex items-center gap-2.5 p-2.5
                  border cut-corner text-left transition-colors disabled:cursor-not-allowed
                  disabled:opacity-60 ${
                    mine
                      ? "border-battle-pink bg-battle-pink/10"
                      : "border-border bg-background hover:border-foreground/40"
                  }`}
              >
                {/* Share bar, behind the content */}
                <span
                  className="absolute inset-y-0 left-0 bg-battle-pink/10 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />

                <span className="relative w-7 h-7 shrink-0 cut-corner overflow-hidden bg-card border border-border">
                  {c.logo_url ? (
                    <Image src={c.logo_url} alt={c.name} fill sizes="28px" className="object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center font-arcade text-[10px] text-foreground/50">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>

                <span className="relative min-w-0 flex-1">
                  <span className="font-arcade text-[11px] font-bold text-foreground truncate block">
                    {c.name}
                  </span>
                  {c.description && (
                    <span className="text-[10px] text-foreground/40 font-sans truncate block">
                      {c.description}
                    </span>
                  )}
                </span>

                <span className="relative flex items-center gap-1.5 shrink-0">
                  <span className="font-arcade text-[11px] tabular-nums text-foreground/60">
                    {votes}
                  </span>
                  {mine && <Check className="w-3.5 h-3.5 text-battle-pink" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {pending && (
        <span className="inline-flex items-center gap-1.5 text-[10px] text-foreground/40 font-sans">
          <Loader2 className="w-3 h-3 animate-spin" /> Saving
        </span>
      )}

      {error && (
        <p role="alert" className="text-[11px] text-battle-red font-sans">
          {error}
        </p>
      )}

      {closed && (
        <p className="text-[10px] text-foreground/35 font-sans text-center">
          This arena has closed — preferences are locked.
        </p>
      )}
    </div>
  );
}
