import { getAdminOverview } from "@/actions/admin/analytics";
import { syncStripe } from "@/actions/admin/sync";
import GodEyePanel from "./_components/GodEyePanel";

export const dynamic = "force-dynamic";

/**
 * Console landing.
 *
 * Stripe is reconciled on the way in rather than behind a button. A refund
 * that has not been applied is a number on this page that is wrong, and a
 * figure you have to remember to refresh is a figure you will read stale. The
 * sync writes only refund reversals, so running it on load is safe; it is
 * awaited before the overview so the totals reflect it.
 */
export default async function AdminPage() {
  const sync = await syncStripe();
  const overview = await getAdminOverview();

  return (
    <GodEyePanel
      overview={overview}
      sync={sync.ok ? sync.data : null}
      syncError={sync.ok ? null : sync.error}
    />
  );
}
