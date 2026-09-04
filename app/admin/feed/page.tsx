import { listRecentVotes, listProfiles } from "@/actions/admin/moderation";
import { listRooms } from "@/actions/admin/rooms";
import FeedPanel from "../_components/FeedPanel";

export const dynamic = "force-dynamic";

export default async function AdminFeedPage() {
  const [votes, profiles, rooms] = await Promise.all([
    listRecentVotes(),
    listProfiles(),
    listRooms(),
  ]);

  return <FeedPanel votes={votes} profiles={profiles} rooms={rooms} />;
}
