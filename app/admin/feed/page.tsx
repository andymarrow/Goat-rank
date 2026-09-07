import { listRecentVotes } from "@/actions/admin/moderation";
import { listRooms } from "@/actions/admin/rooms";
import FeedPanel from "../_components/FeedPanel";

export const dynamic = "force-dynamic";

export default async function AdminFeedPage() {
  const [votes, rooms] = await Promise.all([listRecentVotes(), listRooms()]);

  return <FeedPanel votes={votes} rooms={rooms} />;
}
