import { listDemoRooms } from "@/actions/admin/demo";
import { listEntities } from "@/actions/admin/roster";
import { listCategories } from "@/actions/admin/config";
import DemoPanel from "../_components/DemoPanel";

export const dynamic = "force-dynamic";

export default async function AdminDemoPage() {
  const [rooms, roster, categories] = await Promise.all([
    listDemoRooms(),
    listEntities(),
    listCategories(),
  ]);

  return <DemoPanel rooms={rooms} roster={roster} categories={categories} />;
}
