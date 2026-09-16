import {
  listCategories, listCharities, listBanners, getFreePickAllowance,
} from "@/actions/admin/config";
import ConfigPanel from "../_components/ConfigPanel";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const [categories, charities, banners, freePicks] = await Promise.all([
    listCategories(),
    listCharities(),
    listBanners(),
    getFreePickAllowance(),
  ]);

  return (
    <ConfigPanel
      categories={categories}
      charities={charities}
      banners={banners}
      freePickAllowance={freePicks}
    />
  );
}
