import Link from "next/link";
import { Home, Compass, Swords, Activity, User } from "lucide-react";

export default function MobileTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 w-full h-16 z-50 bg-background/90 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 pb-safe">
      <Link href="/" className="flex flex-col items-center gap-1 text-foreground/60 hover:text-primary transition-colors p-2">
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium">Home</span>
      </Link>
      <Link href="/explore" className="flex flex-col items-center gap-1 text-foreground/60 hover:text-primary transition-colors p-2">
        <Compass className="w-5 h-5" />
        <span className="text-[10px] font-medium">Explore</span>
      </Link>
      
      {/* Floating Action Button (FAB) for Create */}
      <Link href="/create" className="relative -top-4 flex flex-col items-center group">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-[0_8px_15px_rgba(255,122,0,0.4)] group-hover:scale-105 transition-transform">
          <Swords className="w-6 h-6" />
        </div>
      </Link>
      
      <Link href="/activity" className="flex flex-col items-center gap-1 text-foreground/60 hover:text-primary transition-colors p-2">
        <Activity className="w-5 h-5" />
        <span className="text-[10px] font-medium">Activity</span>
      </Link>
      <Link href="/profile" className="flex flex-col items-center gap-1 text-foreground/60 hover:text-primary transition-colors p-2">
        <User className="w-5 h-5" />
        <span className="text-[10px] font-medium">Profile</span>
      </Link>
    </nav>
  );
}