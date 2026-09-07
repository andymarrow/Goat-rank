import { notFound } from "next/navigation";
import { getAdminRoom } from "@/actions/admin/rooms";
import { listCategories, listCharities } from "@/actions/admin/config";
import ArenaEditor from "./_components/ArenaEditor";

export const dynamic = "force-dynamic";

export default async function AdminArenaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [room, categories, charities] = await Promise.all([
    getAdminRoom(id),
    listCategories(),
    listCharities(),
  ]);

  if (!room) notFound();

  return <ArenaEditor room={room} categories={categories} charities={charities} />;
}
