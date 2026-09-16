import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPledgeByPaymentId } from "@/actions/getPledge";
import { absolute, SITE_NAME } from "@/lib/seo";
import PledgeCard from "./_components/PledgeCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pledge = await getPledgeByPaymentId(id);

  if (!pledge) return { title: "Pledge", robots: { index: false } };

  const money = `$${Math.round(pledge.amount).toLocaleString("en-US")}`;
  const title = `${pledge.voterName} put ${money} behind ${pledge.contender.name}`;

  const description = pledge.message
    ? `"${pledge.message}" — ${pledge.arena.title} on ${SITE_NAME}. 30% of every pledge goes to charity.`
    : `${pledge.arena.title} on ${SITE_NAME}. Back a side and 30% of your pledge goes to charity.`;

  return {
    title,
    description,
    alternates: { canonical: absolute(`/pledge/${id}`) },
    openGraph: { title, description, type: "article", url: absolute(`/pledge/${id}`) },
    twitter: { card: "summary_large_image", title, description },
    // A pledge page is for sharing, not for ranking: hundreds of
    // near-identical pages would dilute the arena pages that should rank.
    robots: { index: false, follow: true },
  };
}

export default async function PledgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pledge = await getPledgeByPaymentId(id);

  if (!pledge) notFound();

  return <PledgeCard pledge={pledge} shareId={id} url={absolute(`/pledge/${id}`)} />;
}
