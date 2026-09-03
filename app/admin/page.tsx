import { getAdminUser } from "@/utils/supabase/admin-auth";
import { getAdminOverview } from "@/actions/admin/analytics";
import { listRooms } from "@/actions/admin/rooms";
import { listEntities } from "@/actions/admin/roster";
import { listRecentVotes, listProfiles } from "@/actions/admin/moderation";
import { listPayoutRequests, listCharityLedger } from "@/actions/admin/payouts";
import { listCategories, listCharities, listBanners } from "@/actions/admin/config";
import { listAdminAvatars } from "@/actions/admin/avatars";
import AdminShell from "./_components/AdminShell";

export const dynamic = "force-dynamic";

/**
 * Single fetch point for the console. Every panel gets plain data as props,
 * following the same server-page/client-component split as app/(HOME)/page.tsx.
 */
export default async function AdminPage() {
  const admin = await getAdminUser();

  const [
    overview,
    rooms,
    entities,
    votes,
    profiles,
    payouts,
    charityLedger,
    categories,
    charities,
    banners,
    avatars,
  ] = await Promise.all([
    getAdminOverview(),
    listRooms(),
    listEntities(),
    listRecentVotes(),
    listProfiles(),
    listPayoutRequests(),
    listCharityLedger(),
    listCategories(),
    listCharities(),
    listBanners(),
    listAdminAvatars(),
  ]);

  return (
    <AdminShell
      adminName={admin?.username ?? "Operator"}
      overview={overview}
      rooms={rooms}
      entities={entities}
      votes={votes}
      profiles={profiles}
      payouts={payouts}
      charityLedger={charityLedger}
      categories={categories}
      charities={charities}
      banners={banners}
      avatars={avatars}
    />
  );
}
