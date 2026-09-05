"use client";

import { usePathname } from "next/navigation";
import DesktopNavbar from "./DesktopNavbar";
import MobileTabBar from "./MobileTabBar";
import SiteFooter from "./SiteFooter";

/**
 * Global navigation chrome.
 *
 * Mounted once in the root layout so every route gets nav — previously only
 * the (HOME) group did, which left /battle, /global, /profile and /dashboard
 * with no way back out.
 */
const BARE_ROUTES = ["/admin", "/login", "/callback"];

/**
 * Immersive routes size themselves to the viewport. Appending a footer below
 * them pushed the page taller than the screen and left dead space under the
 * fold, which is the empty gap at the bottom of an arena.
 */
const IMMERSIVE_ROUTES = ["/battle", "/global"];

export default function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  const bare = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (bare) return <>{children}</>;

  const immersive = IMMERSIVE_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopNavbar />

      {/* pt-16 clears the fixed desktop navbar; pb-20 clears the mobile tab
          bar so the last row of content is never trapped underneath it. */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto pt-0 md:pt-16 pb-20 md:pb-0">
        {children}
      </main>

      {/* Desktop only. On a phone the footer sat under the fixed tab bar and
          could not be scrolled to — its links live in the More sheet instead. */}
      {!immersive && (
        <div className="hidden md:block">
          <SiteFooter />
        </div>
      )}

      <MobileTabBar />
    </div>
  );
}
