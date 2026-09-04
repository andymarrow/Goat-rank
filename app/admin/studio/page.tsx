import { listRooms } from "@/actions/admin/rooms";
import { listEntities } from "@/actions/admin/roster";
import { listCategories, listCharities } from "@/actions/admin/config";
import StudioPanel from "../_components/StudioPanel";

export const dynamic = "force-dynamic";

export default async function AdminStudioPage() {
  const [rooms, roster, categories, charities] = await Promise.all([
    listRooms(),
    listEntities(),
    listCategories(),
    listCharities(),
  ]);

  return (
    <StudioPanel rooms={rooms} roster={roster} categories={categories} charities={charities} />
  );
}
