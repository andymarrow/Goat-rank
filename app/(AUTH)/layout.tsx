import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-background flex flex-col font-sans">
      {/* Simple header for Auth pages */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center transform transition-transform group-hover:scale-105 shadow-xs">
            <Zap className="text-primary-foreground w-5 h-5" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-foreground uppercase">GOATRANK</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}