import OriginalHomePage, { metadata as originalMetadata } from "../page.original";

export const metadata = originalMetadata;
export const dynamic = "force-dynamic";

export default async function ArenaPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string; mock?: string }>;
}) {
  return <OriginalHomePage searchParams={searchParams} />;
}
