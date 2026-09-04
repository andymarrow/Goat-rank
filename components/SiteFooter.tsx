import Link from "next/link";
import { HeartHandshake } from "lucide-react";

/**
 * Site footer.
 *
 * Exists mainly so the policy pages are reachable — an unlinked privacy page
 * is the same as not having one, and "where the money goes" is the question
 * people most need answered before they pay.
 */
export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-card mt-auto">
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <span className="font-arcade text-sm font-bold tracking-wider text-foreground">
            GOAT<span className="text-primary">RANK</span>
          </span>
          <p className="text-[11px] text-foreground/40 font-sans mt-1 max-w-xs leading-relaxed">
            Settle the debate. 30% of every arena goes to charity.
          </p>
        </div>

        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link
            href="/legal/money"
            className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50
                       hover:text-primary transition-colors inline-flex items-center gap-1.5"
          >
            <HeartHandshake className="w-3 h-3" /> Where the money goes
          </Link>
          {[
            { href: "/legal/privacy", label: "Privacy" },
            { href: "/legal/terms", label: "Terms" },
            { href: "/profile", label: "Roster" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-arcade text-[10px] uppercase tracking-widest text-foreground/50 hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
