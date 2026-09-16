"use client";

import Link from "next/link";
import { Wallet, ArrowRight } from "lucide-react";

const money = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

/**
 * What hosting this arena has paid.
 *
 * Your best distribution is creators sharing their own arena, because they
 * earn on every pledge. But "Host" was a nav link with no number attached, so
 * nobody knew there was anything in it. Stating what this specific arena has
 * paid its host turns an abstract offer into an observable one.
 *
 * Deliberately quiet, and deliberately not a button that competes with
 * backing: it sits below the action, states a fact, and offers a link.
 */
export default function HostTeaser({
  pool,
  arenaTitle,
  className = "",
}: {
  pool: number;
  arenaTitle: string;
  className?: string;
}) {
  const earned = (Number(pool) || 0) * 0.1;

  return (
    <Link
      href={`/create?from=${encodeURIComponent(arenaTitle)}`}
      className={`group flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/20
                  px-4 py-3 hover:border-primary/40 hover:bg-muted/40 transition-colors ${className}`}
    >
      <span className="shrink-0 rounded-xl bg-sky-500/10 border border-sky-500/30 p-2 text-sky-500">
        <Wallet className="w-4 h-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground font-sans">
          {earned >= 1 ? (
            <>
              Hosting this arena has paid{" "}
              <strong className="text-foreground font-bold tabular-nums">{money(earned)}</strong>
            </>
          ) : (
            <>Every arena pays its host 10% of each pledge</>
          )}
        </span>
        <span className="block text-sm font-bold text-foreground">
          Start your own argument
        </span>
      </span>

      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </Link>
  );
}
