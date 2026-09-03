"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Flame, Clock, Sparkles, TrendingDown } from "lucide-react";
import { ROOM_SORTS, type RoomSort } from "@/lib/constants";

const ICONS: Record<RoomSort, typeof Flame> = {
  hot: Flame,
  new: Sparkles,
  closing: Clock,
  quiet: TrendingDown,
};

/**
 * Filters are links, not client state: the active view lives in the URL, so it
 * survives a refresh, works with back/forward, and can be shared.
 */
export default function ArenaFilters({
  sort,
  category,
  categories,
}: {
  sort: RoomSort;
  category: string;
  categories: string[];
}) {
  const pathname = usePathname();
  const params = useSearchParams();

  const hrefWith = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params?.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === "all" || (k === "sort" && v === "hot")) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Sort */}
      <div
        role="group"
        aria-label="Sort arenas"
        className="flex gap-2 overflow-x-auto scrollbar-hide"
      >
        {(Object.keys(ROOM_SORTS) as RoomSort[]).map((key) => {
          const Icon = ICONS[key];
          const active = sort === key;

          return (
            <Link
              key={key}
              href={hrefWith({ sort: key })}
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={`pressable cut-corner border px-3.5 py-2 font-arcade text-[10px] font-bold
                uppercase tracking-widest whitespace-nowrap transition-colors inline-flex items-center gap-1.5
                ${
                  active
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-foreground/55 hover:text-foreground hover:border-foreground/30"
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {ROOM_SORTS[key].label}
            </Link>
          );
        })}
      </div>

      {/* Category — only rendered when there is more than one to choose from */}
      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Filter by category"
          className="flex gap-2 overflow-x-auto scrollbar-hide"
        >
          {["all", ...categories].map((cat) => {
            const active = category.toLowerCase() === cat.toLowerCase();

            return (
              <Link
                key={cat}
                href={hrefWith({ category: cat })}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={`pressable rounded-full border px-3.5 py-1 font-sans text-xs whitespace-nowrap
                  transition-colors ${
                    active
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-foreground/50 hover:text-foreground hover:border-foreground/30"
                  }`}
              >
                {cat === "all" ? "All categories" : cat}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
