import { listRooms } from "@/actions/admin/rooms";
import { listCategories } from "@/actions/admin/config";
import ArenaPanel from "../_components/ArenaPanel";

export const dynamic = "force-dynamic";

export default async function AdminArenasPage() {
  const [rooms, categories] = await Promise.all([listRooms(), listCategories()]);
  return <ArenaPanel rooms={rooms} categories={categories} />;
}
