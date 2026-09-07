import { listRooms } from "@/actions/admin/rooms";
import ArenaPanel from "../_components/ArenaPanel";

export const dynamic = "force-dynamic";

export default async function AdminArenasPage() {
  const rooms = await listRooms();
  return <ArenaPanel rooms={rooms} />;
}
