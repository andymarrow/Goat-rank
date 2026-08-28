"use client";

import Link from "next/link";
import { Search, Swords, User, Zap, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DesktopNavbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  return (
    <header className="hidden md:flex fixed top-0 w-full h-16 z-40 bg-background/80 backdrop-blur-md border-b border-border items-center justify-between px-6 lg:px-12">
      {/* Logo Area */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center transform transition-transform group-hover:rotate-12">
          <Zap className="text-primary-foreground w-5 h-5" />
        </div>
        <span className="font-arcade text-xl font-bold tracking-wider">GOATRANK</span>
      </Link>

      {/* Main Categories Navigation */}
      <nav className="flex items-center gap-8 font-medium text-sm text-foreground/70">
        <Link href="/sports" className="hover:text-primary transition-colors">Sports</Link>
        <Link href="/movies" className="hover:text-primary transition-colors">Movies</Link>
        <Link href="/cars" className="hover:text-primary transition-colors">Cars</Link>
        <Link href="/countries" className="hover:text-primary transition-colors">Countries</Link>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        {mounted && (
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-foreground/70 hover:text-primary"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-foreground/70 hover:text-primary">
          <Search className="w-5 h-5" />
        </button>

        <Link 
          href="/create" 
          className="cut-corner flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 font-arcade font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          <Swords className="w-4 h-4" />
          <span>Host Battle ($10)</span>
        </Link>
        
        <Link href="/profile" className="w-9 h-9 rounded-full bg-border flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
          <User className="w-4 h-4 text-foreground/70" />
        </Link>
      </div>
    </header>
  );
}