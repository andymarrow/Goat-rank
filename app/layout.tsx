import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import NoiseOverlay from "@/components/ui/NoiseOverlay";
import SiteBanner from "@/components/SiteBanner";
import LayoutChrome from "@/components/LayoutChrome";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { cn } from "@/lib/utils";
import {
  SITE_URL, SITE_NAME, TAGLINE, DESCRIPTION, jsonLd, organizationSchema, websiteSchema,
} from "@/lib/seo";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  // Required for canonical and social URLs to resolve absolutely; without it
  // every unfurl points at localhost. SITE_URL is the www host, because the
  // apex 308-redirects to it and a canonical must not point at a redirect.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: ${TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  // Terms people actually type. Not a ranking factor at Google any more, but
  // still read by several smaller engines and by scrapers that feed answer
  // engines.
  keywords: [
    "settle the debate",
    "greatest of all time",
    "GOAT debate",
    "crowdfunded leaderboard",
    "charity leaderboard",
    "vote with money",
    "1v1 debate",
    "who is the GOAT",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME}: ${TAGLINE}`,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME}: ${TAGLINE}`,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
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
        {/* One connected graph for the whole site. Page-level nodes reference
            these by @id rather than restating the publisher on every route. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd(organizationSchema(), websiteSchema())),
          }}
        />

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