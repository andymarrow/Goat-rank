import DesktopNavbar from "./DesktopNavbar";
import MobileTabBar from "./MobileTabBar";

export default function LayoutChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <DesktopNavbar />
      
      {/* 
        pt-16 pushes content below desktop nav.
        pb-20 pushes content above mobile tab bar.
      */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto pt-0 md:pt-16 pb-20 md:pb-0">
        {children}
      </main>

      <MobileTabBar />
    </div>
  );
}