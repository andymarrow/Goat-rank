"use client";

import Link from "next/link";
import { Search, Swords, User, Zap, Sun, Moon, LogIn } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export default function DesktopNavbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    
    // Check if user is logged in
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch their profile for the avatar
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
        setProfile(profileData);
      }
    };

    fetchUser();

    // Listen for auth changes (like if they log out)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  return (
    <header className="hidden md:flex fixed top-0 w-full h-16 z-40 bg-background/80 backdrop-blur-md border-b border-border items-center justify-between px-6 lg:px-12">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center transform transition-transform group-hover:rotate-12">
          <Zap className="text-primary-foreground w-5 h-5" />
        </div>
        <span className="font-arcade text-xl font-bold tracking-wider">GOATRANK</span>
      </Link>

      <nav className="flex items-center gap-8 font-medium text-sm text-foreground/70">
        <Link href="/sports" className="hover:text-primary transition-colors">Sports</Link>
        <Link href="/movies" className="hover:text-primary transition-colors">Movies</Link>
        <Link href="/cars" className="hover:text-primary transition-colors">Cars</Link>
        <Link href="/countries" className="hover:text-primary transition-colors">Countries</Link>
      </nav>

      <div className="flex items-center gap-4">
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
        
        {/* Dynamic Auth Button */}
        {user ? (
          <Link href="/dashboard" className="w-9 h-9 cut-corner bg-background border border-border overflow-hidden hover:border-primary transition-colors">
             {profile?.avatar_url ? (
               <Image src={profile.avatar_url} alt="Profile" width={36} height={36} className="object-cover w-full h-full" />
             ) : (
               <User className="w-4 h-4 m-2 text-foreground/70" />
             )}
          </Link>
        ) : (
          <Link href="/login" className="cut-corner flex items-center gap-2 bg-background border border-border text-foreground px-4 py-2 font-arcade text-xs hover:border-primary hover:text-primary transition-colors">
             <LogIn className="w-4 h-4" /> LOGIN
          </Link>
        )}
      </div>
    </header>
  );
}