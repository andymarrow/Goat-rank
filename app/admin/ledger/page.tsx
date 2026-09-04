import { listPayoutRequests, listCharityLedger } from "@/actions/admin/payouts";
import LedgerPanel from "../_components/LedgerPanel";

export const dynamic = "force-dynamic";

export default async function AdminLedgerPage() {
  const [payouts, charityLedger] = await Promise.all([
    listPayoutRequests(),
    listCharityLedger(),
  ]);

  return <LedgerPanel payouts={payouts} charityLedger={charityLedger} />;
}
