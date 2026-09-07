"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Flame, Clock, Sparkles, TrendingDown, ChevronRight, SlidersHorizontal, Check, ChevronDown } from "lucide-react";
import { FlameIcon } from "@/components/ui/flame";
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hrefWith = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params?.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || !v || v === "all" || (k === "sort" && v === "hot") || (k === "mock" && v === "false")) {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const toggleMockHref = hrefWith({ mock: "true" });
  const activeCategoryLabel = category.toLowerCase() === "all" ? "All Categories" : category;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
      <div>
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5 group cursor-pointer shrink-0">
          Active Face-Offs
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </h2>
      </div>

      <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap sm:flex-nowrap">
        {/* Sort filters */}
        <div role="group" aria-label="Sort arenas" className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink">
          {(Object.keys(ROOM_SORTS) as RoomSort[]).map((key) => {
            const Icon = ICONS[key];
            const active = sort === key;

            return (
              <Link
                key={key}
                href={hrefWith({ sort: key })}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className={`rounded-full px-3 py-1 font-sans text-xs font-medium
                  whitespace-nowrap transition-colors inline-flex items-center gap-1.5
                  ${active
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                {key === "hot" ? (
                  <FlameIcon size={14} className="shrink-0" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                {ROOM_SORTS[key].label}
              </Link>
            );
          })}
        </div>

        {/* Action Controls (Dropdown & Toggle) - Unclipped container */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {/* Filter Dropdown Menu Button (for Categories) */}
          {categories.length > 0 && (
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen((prev) => !prev);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  category.toLowerCase() !== "all"
                    ? "bg-primary/15 border-primary/40 text-primary font-semibold"
                    : "bg-muted/60 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="capitalize">{activeCategoryLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Floating Glassmorphic Dropdown Panel */}
              {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-zinc-900 border border-zinc-800 p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 text-xs">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Categories
                  </div>
                  {["all", ...categories].map((cat) => {
                    const active = category.toLowerCase() === cat.toLowerCase();
                    return (
                      <Link
                        key={cat}
                        href={hrefWith({ category: cat })}
                        scroll={false}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-foreground hover:bg-zinc-800/80"
                        }`}
                      >
                        <span className="capitalize">{cat === "all" ? "All Categories" : cat}</span>
                        {active && <Check className="w-3.5 h-3.5" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Small Dot Button to Toggle Between Actual Data & Mock Data */}
          <Link
            href={toggleMockHref}
            scroll={false}
            title={"Showing Actual Data (click to enable Mock Data)"}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors ${false
                ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"
                : "bg-emerald-500"
                }`}
            />
            <span className="text-[11px] font-medium hidden sm:inline">
              {"Live DB"}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
