import { listAdminAvatars } from "@/actions/admin/avatars";
import AvatarPanel from "../_components/AvatarPanel";

export const dynamic = "force-dynamic";

export default async function AdminAvatarsPage() {
  const avatars = await listAdminAvatars();
  return <AvatarPanel avatars={avatars} />;
}
