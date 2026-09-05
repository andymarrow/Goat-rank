"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search, Loader2, Check, ImageOff, X } from "lucide-react";

import { searchEntities, type EntityOption } from "@/actions/searchEntities";

/**
 * Type-ahead for contenders that already exist.
 *
 * Without this a creator had no way to know Ronaldo was already on the
 * platform, so they retyped the name and the roster grew a duplicate. Picking
 * an existing contender links to it instead of minting a new one, which keeps
 * lifetime totals and profile pages intact.
 */
export default function EntitySearch({
  category,
  onPick,
  placeholder = "Search contenders already on GOAT Rank…",
}: {
  category?: string;
  onPick: (entity: EntityOption) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced so a fast typist doesn't fire a query per keystroke.
  useEffect(() => {
    if (!open) return;

    const id = setTimeout(async () => {
      setLoading(true);
      setResults(await searchEntities(query, category));
      setLoading(false);
    }, 220);

    return () => clearTimeout(id);
  }, [query, category, open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 pointer-events-none" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          aria-label="Search existing contenders"
          className="w-full bg-background border border-border cut-corner pl-9 pr-9 py-3 text-sm
                     text-foreground font-sans outline-none focus:border-primary transition-colors
                     placeholder:text-foreground/30"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            aria-label="Clear"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div
          className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto scrollbar-hide
                     bg-card border border-border cut-corner shadow-2xl"
        >
          {results.length === 0 ? (
            <p className="px-3 py-4 text-xs text-foreground/40 font-sans text-center">
              {loading
                ? "Searching…"
                : query
                ? `No contender called "${query}" yet — add them below.`
                : "Start typing a name."}
            </p>
          ) : (
            <ul className="p-1.5 flex flex-col gap-1">
              {results.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(e);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="pressable w-full flex items-center gap-3 p-2 cut-corner
                               hover:bg-foreground/5 transition-colors text-left"
                  >
                    <span className="relative w-10 h-10 shrink-0 bg-background border border-border cut-corner overflow-hidden">
                      {e.image_url ? (
                        <Image src={e.image_url} alt={e.name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-foreground/20">
                          <ImageOff className="w-4 h-4" />
                        </span>
                      )}
                      <span
                        className="absolute bottom-0 inset-x-0 h-0.5"
                        style={{ backgroundColor: e.brand_color ?? "#FF7A00" }}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-arcade text-xs font-bold text-foreground truncate">
                        {e.name}
                      </span>
                      <span className="block text-[10px] text-foreground/40 font-sans">
                        {e.category}
                        {Number(e.lifetime_raised) > 0 &&
                          ` · $${Number(e.lifetime_raised).toLocaleString()} raised`}
                      </span>
                    </span>

                    <Check className="w-4 h-4 text-primary shrink-0 opacity-0 group-hover:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
