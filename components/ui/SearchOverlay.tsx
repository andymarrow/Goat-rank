"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, X, Swords, Globe, User, Loader2, ArrowRight, Flame, CornerDownLeft,
} from "lucide-react";

import { searchEverything, type SearchResults } from "@/actions/search";
import Avatar from "@/components/ui/Avatar";
import { DemoDot } from "@/components/ui/DemoBadge";
import { formatCountdown } from "@/lib/time";

const EMPTY: SearchResults = { arenas: [], contenders: [], people: [] };
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

type Row = { key: string; href: string };

/**
 * Search across arenas, contenders and people.
 *
 * One box rather than three: someone arriving from a post knows a name — the
 * argument, the contender in it, or the person who staged it — and should not
 * have to know which of those the site files it under. Results stay grouped
 * because the three are ranked on different things, and arrow keys walk the
 * whole list regardless of group so the keyboard path is one list.
 */
export default function SearchOverlay({
  open,
  onClose,
  categories = [],
}: {
  open: boolean;
  onClose: () => void;
  categories?: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [cursor, setCursor] = useState(0);
  const [pending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef(0);

  const run = useCallback((q: string, cat: string) => {
    const ticket = ++latest.current;

    startTransition(async () => {
      const res = await searchEverything(q, cat);
      // A slower earlier request must not overwrite a newer answer.
      if (ticket === latest.current) {
        setResults(res);
        setCursor(0);
      }
    });
  }, []);

  // Debounced: every keystroke otherwise costs three queries.
  useEffect(() => {
    if (!open) return;

    const id = setTimeout(() => run(query, category), query ? 180 : 0);
    return () => clearTimeout(id);
  }, [open, query, category, run]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const rows: Row[] = [
    ...results.arenas.map((a) => ({
      key: `arena-${a.id}`,
      href: `/${a.room_type === "global" ? "global" : "battle"}/${a.id}`,
    })),
    ...results.contenders.map((c) => ({ key: `entity-${c.id}`, href: `/profile/${c.id}` })),
    ...results.people.map((p) => ({ key: `person-${p.id}`, href: `/u/${p.id}` })),
  ];

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (rows.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setCursor((c) => (c + step + rows.length) % rows.length);
    }

    if (e.key === "Enter" && rows[cursor]) {
      e.preventDefault();
      onClose();
      router.push(rows[cursor].href);
    }
  };

  if (!open) return null;

  const nothing = !pending && rows.length === 0;
  const index = (key: string) => rows.findIndex((r) => r.key === key);

  const rowClass = (key: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
      index(key) === cursor ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-muted/60"
    }`;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center p-3 sm:p-6 pt-[10vh]"
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search GOAT Rank"
        className="relative w-full max-w-2xl rounded-2xl bg-card border border-border/80 shadow-2xl
                   overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Query */}
        <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-border/60">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search arenas, contenders, people…"
            aria-label="Search"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-foreground
                       font-sans placeholder:text-muted-foreground"
          />
          {pending && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground
                       hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 px-3 sm:px-4 py-2.5 overflow-x-auto scrollbar-hide border-b border-border/60">
            {["all", ...categories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors cursor-pointer ${
                  category === c
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "all" ? "Everything" : c}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 flex flex-col gap-4">
          {nothing && (
            <div className="py-12 text-center flex flex-col items-center gap-2">
              <Search className="w-6 h-6 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">
                {query ? `Nothing matches "${query}"` : "Nothing here yet"}
              </p>
              {query && (
                <Link
                  href={`/create?title=${encodeURIComponent(query)}`}
                  onClick={onClose}
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  Start this argument <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}

          {results.arenas.length > 0 && (
            <Group label="Arenas">
              {results.arenas.map((a) => (
                <Link
                  key={a.id}
                  href={`/${a.room_type === "global" ? "global" : "battle"}/${a.id}`}
                  onClick={onClose}
                  onMouseEnter={() => setCursor(index(`arena-${a.id}`))}
                  className={rowClass(`arena-${a.id}`)}
                >
                  <span className="shrink-0 w-9 h-9 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center text-primary">
                    {a.room_type === "global" ? (
                      <Globe className="w-4 h-4" />
                    ) : (
                      <Swords className="w-4 h-4" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      {a.is_demo && <DemoDot />}
                      <span className="font-semibold text-sm text-foreground truncate">
                        {a.title}
                      </span>
                    </span>
                    <span className="block text-[11px] text-muted-foreground truncate">
                      {a.category} · {money(a.total_pool)} pool
                      {a.leader ? ` · ${a.leader} leads` : ""} · {formatCountdown(a.expires_at)}
                    </span>
                  </span>

                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </Group>
          )}

          {results.contenders.length > 0 && (
            <Group label="Contenders">
              {results.contenders.map((c) => (
                <Link
                  key={c.id}
                  href={`/profile/${c.id}`}
                  onClick={onClose}
                  onMouseEnter={() => setCursor(index(`entity-${c.id}`))}
                  className={rowClass(`entity-${c.id}`)}
                >
                  <Avatar
                    src={c.image_url}
                    name={c.name}
                    size={36}
                    color={c.brand_color}
                    className="!rounded-xl"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-sm text-foreground truncate">
                      {c.name}
                    </span>
                    <span className="block text-[11px] text-muted-foreground truncate">
                      {c.category} · {money(c.lifetime_raised)} raised all-time
                    </span>
                  </span>

                  {c.lifetime_raised > 0 && (
                    <Flame className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </Link>
              ))}
            </Group>
          )}

          {results.people.length > 0 && (
            <Group label="People">
              {results.people.map((p) => (
                <Link
                  key={p.id}
                  href={`/u/${p.id}`}
                  onClick={onClose}
                  onMouseEnter={() => setCursor(index(`person-${p.id}`))}
                  className={rowClass(`person-${p.id}`)}
                >
                  <Avatar
                    src={p.avatar_url}
                    name={p.username ?? "?"}
                    size={36}
                    className="!rounded-full"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      {p.is_bot && <DemoDot />}
                      <span className="font-semibold text-sm text-foreground truncate">
                        {p.username ?? "unnamed"}
                      </span>
                    </span>
                    <span className="block text-[11px] text-muted-foreground truncate">
                      {p.total_earned > 0 ? `${money(p.total_earned)} earned hosting` : "Supporter"}
                    </span>
                  </span>

                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </Group>
          )}
        </div>

        {/* Footer hint */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 border-t border-border/60 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          <span className="inline-flex items-center gap-1">
            <Key>↑</Key>
            <Key>↓</Key> move
          </span>
          <span className="inline-flex items-center gap-1">
            <Key>
              <CornerDownLeft className="w-2.5 h-2.5" />
            </Key>{" "}
            open
          </span>
          <span className="inline-flex items-center gap-1">
            <Key>esc</Key> close
          </span>
        </div>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="px-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded
                    border border-border/60 bg-muted/50 text-[9px] font-mono text-foreground">
      {children}
    </kbd>
  );
}
