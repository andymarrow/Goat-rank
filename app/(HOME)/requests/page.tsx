import type { Metadata } from "next";
import { listRequests } from "@/actions/requests";
import { absolute } from "@/lib/seo";
import RequestsBoard from "./_components/RequestsBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Requests",
  description:
    "Ask for a feature, nominate a charity, and back the ones you want most. The board is public and ranked by backing.",
  alternates: { canonical: absolute("/requests") },
};

export default async function RequestsPage() {
  const requests = await listRequests();
  return <RequestsBoard initialRequests={requests} />;
}
