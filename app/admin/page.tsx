import { getAdminOverview } from "@/actions/admin/analytics";
import GodEyePanel from "./_components/GodEyePanel";

export const dynamic = "force-dynamic";

/**
 * Console landing. Each section is its own route now, so this only loads the
 * overview instead of every dataset on the platform.
 */
export default async function AdminPage() {
  const overview = await getAdminOverview();
  return <GodEyePanel overview={overview} />;
}
