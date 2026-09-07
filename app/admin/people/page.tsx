import { listProfiles } from "@/actions/admin/moderation";
import PeoplePanel from "../_components/PeoplePanel";

export const dynamic = "force-dynamic";

export default async function AdminPeoplePage() {
  const profiles = await listProfiles();
  return <PeoplePanel profiles={profiles} />;
}
