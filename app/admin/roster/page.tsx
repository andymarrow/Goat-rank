import { listEntities } from "@/actions/admin/roster";
import { listCategories } from "@/actions/admin/config";
import RosterPanel from "../_components/RosterPanel";

export const dynamic = "force-dynamic";

export default async function AdminRosterPage() {
  const [entities, categories] = await Promise.all([listEntities(), listCategories()]);
  return <RosterPanel entities={entities} categories={categories} />;
}
