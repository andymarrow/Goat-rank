import type { Metadata } from "next";
import { getMyRewards } from "@/actions/rewards";
import { absolute } from "@/lib/seo";
import RewardsBoard from "./_components/RewardsBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rewards",
  description:
    "Earn GOAT points for backing, hosting, picking and showing up. Points buy arenas, contender slots and free picks, and lift your level.",
  alternates: { canonical: absolute("/rewards") },
};

export default async function RewardsPage() {
  const data = await getMyRewards();
  return <RewardsBoard {...data} />;
}
