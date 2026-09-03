import type { Metadata, Viewport } from "next";
import { Outfit, Orbitron } from "next/font/google"; 
import NoiseOverlay from "@/components/ui/NoiseOverlay";
import SiteBanner from "@/components/SiteBanner";
import LayoutChrome from "@/components/LayoutChrome";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-arcade", 
  display: "swap",
});

export const metadata: Metadata = {
  title: "GOAT Rank | Settle the Debate",
  description: "Crowdfunded leaderboards and 1v1 battles. Settle the debate for charity.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F3ED" },
    { media: "(prefers-color-scheme: dark)", color: "#030303" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${orbitron.variable} antialiased relative min-h-screen flex flex-col transition-colors duration-500`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NoiseOverlay />

          {/* Global megaphone, pushed from /admin -> Config. Renders nothing
              when no banner is live. */}
          <SiteBanner />

          {/* Navigation is global. LayoutChrome opts /admin and the auth pages
              out; every other route now has a way back. */}
          <LayoutChrome>{children}</LayoutChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}