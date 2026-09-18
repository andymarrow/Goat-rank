import { getRewardConfig } from "@/actions/admin/rewards";
import RewardsPanel from "../_components/RewardsPanel";

export const dynamic = "force-dynamic";

export default async function AdminRewardsPage() {
  const config = await getRewardConfig();
  return <RewardsPanel {...config} />;
}
