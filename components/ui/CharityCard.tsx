"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, HeartHandshake } from "lucide-react";

export type Beneficiary = {
  id: string | null;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
};

/**
 * The cause an arena is raising for.
 *
 * Arenas used to name their charity in a single line of grey text, which asks
 * people to send money to a name they may not recognise. The logo, the
 * one-liner and the link out let a backer see who they are supporting before
 * they pledge.
 */
export default function CharityCard({
  charity,
  className = "",
}: {
  charity: Beneficiary;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showLogo = charity.logo_url && !failed;

  return (
    <div
      className={`w-full rounded-2xl bg-card border border-border/80 p-4 shadow-xs
                  flex items-center gap-3.5 ${className}`}
    >
      <span
        className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl overflow-hidden
                   bg-muted/60 border border-border/60 flex items-center justify-center"
      >
        {showLogo ? (
          <Image
            src={charity.logo_url!}
            alt={charity.name}
            fill
            sizes="56px"
            onError={() => setFailed(true)}
            className="object-cover"
          />
        ) : (
          <HeartHandshake className="w-5 h-5 text-primary" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
          30% of every pledge goes to
        </span>

        <span className="font-bold text-sm sm:text-base text-foreground truncate block">
          {charity.name}
        </span>

        {charity.description && (
          <p className="text-[11px] leading-relaxed text-muted-foreground font-sans line-clamp-2 mt-0.5">
            {charity.description}
          </p>
        )}
      </div>

      {charity.website_url && (
        <a
          href={charity.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-border/60
                     bg-muted/40 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider
                     text-muted-foreground hover:text-primary hover:border-primary/50
                     transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3 h-3" />
          <span className="hidden sm:inline">Visit</span>
        </a>
      )}
    </div>
  );
}
