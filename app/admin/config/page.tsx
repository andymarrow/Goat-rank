import { listCategories, listCharities, listBanners } from "@/actions/admin/config";
import ConfigPanel from "../_components/ConfigPanel";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const [categories, charities, banners] = await Promise.all([
    listCategories(),
    listCharities(),
    listBanners(),
  ]);

  return <ConfigPanel categories={categories} charities={charities} banners={banners} />;
}
