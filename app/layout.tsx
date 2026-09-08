import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import NoiseOverlay from "@/components/ui/NoiseOverlay";
import SiteBanner from "@/components/SiteBanner";
import LayoutChrome from "@/components/LayoutChrome";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { cn } from "@/lib/utils";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://goatrank.lol";
const DESCRIPTION =
  "Back your pick with real money. 60% to the pot, 30% to charity, 10% to the host — the leaderboard everyone argues about, settled in public.";

export const metadata: Metadata = {
  // Required for the social card URLs below to resolve to absolute links;
  // without it every unfurl points at localhost.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GOAT Rank | Settle the Debate",
    template: "%s | GOAT Rank",
  },
  description: DESCRIPTION,
  applicationName: "GOAT Rank",
  openGraph: {
    type: "website",
    siteName: "GOAT Rank",
    title: "GOAT Rank | Settle the Debate",
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "GOAT Rank | Settle the Debate",
    description: DESCRIPTION,
  },
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} font-sans`}>
      <body suppressHydrationWarning className={`${inter.variable} antialiased relative min-h-screen flex flex-col transition-colors duration-500 font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
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