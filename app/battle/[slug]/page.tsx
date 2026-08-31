import BattleClient from "./_components/BattleClient";

export default async function BattlePage({ params }: { params: Promise<{ slug: string }> }) {
  // Await the params to fix the Next.js 15 TypeScript error
  const resolvedParams = await params;

  return (
    // Mobile: viewport minus 80px bottom nav. Desktop: viewport minus 64px top nav.
    <div className="w-full h-[calc(100dvh-80px)] md:h-[calc(100dvh-64px)] flex flex-col md:flex-row overflow-hidden bg-background">
      <BattleClient slug={resolvedParams.slug} />
    </div>
  );
}