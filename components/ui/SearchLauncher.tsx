"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import SearchOverlay from "./SearchOverlay";

/**
 * Opens the search overlay, and owns the keyboard shortcut for it.
 *
 * Two shapes because the two homes are different: a full-width bar the
 * homepage can lead with, and an icon for the navbar. Both drive the same
 * overlay, and Cmd/Ctrl+K works from anywhere the launcher is mounted.
 */
export default function SearchLauncher({
  variant = "bar",
  categories = [],
  className = "",
}: {
  variant?: "bar" | "icon";
  categories?: string[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Search"
          className={`rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-muted/60
                      transition-colors cursor-pointer ${className}`}
        >
          <Search className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`w-full flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card
                      px-4 py-3 text-left shadow-xs hover:border-primary/50 transition-colors
                      cursor-pointer group ${className}`}
        >
          <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          <span className="flex-1 min-w-0 truncate text-sm text-muted-foreground font-sans">
            Search arenas, contenders, people…
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/60
                          bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      )}

      <SearchOverlay open={open} onClose={() => setOpen(false)} categories={categories} />
    </>
  );
}
