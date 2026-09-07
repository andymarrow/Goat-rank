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
      <p className="text-xs text-muted-foreground font-sans text-center py-4">
        No charities registered yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <HeartHandshake className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground font-sans leading-relaxed">
          30% of pool goes to charity. Nominate your preferred cause below.
          {runningTotal > 0 && (
            <span className="text-foreground font-medium"> ({runningTotal} vote{runningTotal === 1 ? "" : "s"} so far)</span>
          )}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {active.map((c) => {
          const votes = Number(votesFor(c.id));
          const pct = runningTotal > 0 ? (votes / runningTotal) * 100 : 0;
          const mine = choice === c.id;

          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={closed || pending || mine}
                onClick={() => pick(c.id)}
                aria-pressed={mine}
                className={`relative w-full overflow-hidden flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                  mine
                    ? "bg-zinc-800 border-zinc-700 text-zinc-100 font-semibold cursor-default shadow-xs"
                    : "border-border/60 bg-muted/30 text-foreground hover:border-border hover:bg-muted/60 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                }`}
              >
                {/* Share bar, behind content */}
                <span
                  className={`absolute inset-y-0 left-0 transition-all duration-500 pointer-events-none ${
                    mine ? "bg-zinc-700/60" : "bg-zinc-800/30"
                  }`}
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />

                <span className="relative w-7 h-7 rounded-lg overflow-hidden bg-card border border-border/60 shrink-0">
                  {c.logo_url ? (
                    <Image src={c.logo_url} alt={c.name} fill sizes="28px" className="object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center font-bold text-xs text-muted-foreground">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>

                <span className="relative min-w-0 flex-1">
                  <span className="font-bold text-xs text-foreground truncate block">
                    {c.name}
                  </span>
                  {c.description && (
                    <span className="text-[10px] text-muted-foreground truncate block font-sans">
                      {c.description}
                    </span>
                  )}
                </span>

                <span className="relative flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs font-bold tabular-nums font-sans ${mine ? "text-zinc-200 font-bold" : "text-muted-foreground"}`}>
                    {votes}
                  </span>
                  {mine && (
                    <span className="px-1.5 py-0.5 rounded-md bg-zinc-700/80 border border-zinc-600/80 text-zinc-200 text-[10px] font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3 stroke-[3]" /> Selected
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {pending && (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Saving preference...
        </span>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-500 font-medium">
          {error}
        </p>
      )}

      {closed && (
        <p className="text-[11px] text-muted-foreground font-sans text-center">
          This arena is closed — preferences are locked.
        </p>
      )}
    </div>
  );
}
