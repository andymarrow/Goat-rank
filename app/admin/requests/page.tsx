import { listAdminRequests } from "@/actions/admin/requests";
import RequestsPanel from "../_components/RequestsPanel";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const requests = await listAdminRequests();
  return <RequestsPanel requests={requests} />;
}
