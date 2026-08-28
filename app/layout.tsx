import type { Metadata, Viewport } from "next";
import { Outfit, Orbitron } from "next/font/google"; // CHANGED TO ORBITRON
import NoiseOverlay from "@/components/ui/NoiseOverlay";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-arcade", // Using this for our numbers and gaming text
  display: "swap",
});


export const metadata: Metadata = {
  title: "GOAT Rank | Settle the Debate",
  description: "Crowdfunded leaderboards and 1v1 battles. Settle the debate for charity.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F3ED" },
    { media: "(prefers-color-scheme: dark)", color: "#121417" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents unwanted zooming on mobile input focus
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${orbitron.variable} antialiased relative min-h-screen flex flex-col`}>
        {/* The tactile paper texture that sits over everything */}
        <NoiseOverlay />
        
        {/* Main Application Wrapper */}
        <main className="flex-1 relative z-10 w-full max-w-[1920px] mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}