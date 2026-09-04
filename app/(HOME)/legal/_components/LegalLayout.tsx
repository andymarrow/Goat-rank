import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Shared shell for the policy pages.
 *
 * Deliberately plain and readable — legal copy is the one place on the site
 * where the arcade styling should get out of the way of the words.
 */
export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-12 pb-28">
      <Link
        href="/"
        className="pressable inline-flex items-center gap-2 mb-6 font-arcade text-[10px]
                   uppercase tracking-widest text-foreground/50 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to the arena
      </Link>

      <h1 className="font-arcade text-2xl md:text-4xl font-black uppercase tracking-wider text-foreground mb-2">
        {title}
      </h1>
      <p className="text-xs text-foreground/40 font-sans mb-8">Last updated {updated}</p>

      <div className="flex flex-col gap-6 text-sm md:text-[15px] leading-relaxed text-foreground/75 font-sans">
        {children}
      </div>

      <nav className="mt-12 pt-6 border-t border-border flex flex-wrap gap-4">
        {[
          { href: "/legal/terms", label: "Terms" },
          { href: "/legal/privacy", label: "Privacy" },
          { href: "/legal/money", label: "Where the money goes" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="font-arcade text-[10px] uppercase tracking-widest text-foreground/45 hover:text-primary transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** Section heading, so the pages stay consistent. */
export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-arcade text-sm md:text-base font-bold uppercase tracking-widest text-foreground mt-4">
      {children}
    </h2>
  );
}
