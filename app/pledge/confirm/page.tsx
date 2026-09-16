import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getPledgeBySession } from "@/actions/getPledge";
import ConfirmingPledge from "./_components/ConfirmingPledge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirming your pledge",
  robots: { index: false, follow: false },
};

/**
 * The landing spot straight after Stripe.
 *
 * The webhook that writes the vote row and the browser redirect race each
 * other, and the browser usually wins. So this resolves the session, and if
 * the row is not there yet it hands off to a client that retries rather than
 * showing a failure for money that has already been taken.
 *
 * Once resolved it redirects to the pledge's own permanent URL, which is the
 * one worth sharing: /pledge/confirm carries a session id that means nothing
 * to anyone else.
 */
export default async function ConfirmPledgePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) redirect("/");

  const pledge = await getPledgeBySession(sessionId);

  if (pledge) redirect(`/pledge/${pledge.paymentId}`);

  return <ConfirmingPledge sessionId={sessionId} />;
}
