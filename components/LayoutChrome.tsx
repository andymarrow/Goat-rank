"use client";

import { usePathname } from "next/navigation";
import DesktopNavbar from "./DesktopNavbar";
import MobileTabBar from "./MobileTabBar";

/**
 * Global navigation chrome.
 *
 * Mounted once in the root layout so every route gets nav — previously only
 * the (HOME) group did, which left /battle, /global, /profile and /dashboard
 * with no way back out.
 *
 * Two routes opt out: /admin ships its own console header, and the auth pages
 * are deliberately chrome-free so nothing competes with the sign-in form.
 */
const BARE_ROUTES = ["/admin", "/login", "/callback"];

export default function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const bare = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  if (bare) return <>{children}</>;

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopNavbar />

      {/* pt-16 clears the fixed desktop navbar; pb-20 clears the mobile tab bar. */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto pt-0 md:pt-16 pb-20 md:pb-0">
        {children}
      </main>

      <MobileTabBar />
    </div>
  );
}
