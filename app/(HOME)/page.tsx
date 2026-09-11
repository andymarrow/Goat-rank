import TemporaryLandingPage from "./_components/TemporaryLandingPage";
import OriginalHomePage from "./page.original";
import { absolute } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "GOAT Rank: Discover & Collect Public Opinions on Topics You Care About",
  },
  description:
    "GoatRank is a social platform for discovering and collecting people's opinions on sports, entertainment, products, public figures, and everyday topics.",
  alternates: { canonical: absolute("/") },
};

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string; mock?: string; view?: string }>;
}) {
  const params = await searchParams;

  // Allow switching dynamically via ?view=arena
  if (params.view === "arena") {
    return <OriginalHomePage searchParams={searchParams} />;
  }

  return <TemporaryLandingPage />;
}
