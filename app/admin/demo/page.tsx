import { listDemoRooms, listBots } from "@/actions/admin/demo";
import { listEntities } from "@/actions/admin/roster";
import { listCategories } from "@/actions/admin/config";
import DemoPanel from "../_components/DemoPanel";

export const dynamic = "force-dynamic";

export default async function AdminDemoPage() {
  const [rooms, bots, roster, categories] = await Promise.all([
    listDemoRooms(),
    listBots(),
    listEntities(),
    listCategories(),
  ]);

  return <DemoPanel rooms={rooms} bots={bots} roster={roster} categories={categories} />;
}
