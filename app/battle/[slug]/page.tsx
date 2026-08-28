import BattleClient from "./_components/BattleClient";

export default function BattlePage({ params }: { params: { slug: string } }) {
  // In the future, we will fetch the battle data from Supabase here using the slug.
  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden">
      <BattleClient slug={params.slug} />
    </div>
  );
}