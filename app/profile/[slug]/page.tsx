import ProfileClient from "./_components/ProfileClient";

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  return (
    <div className="w-full min-h-screen pb-24">
      <ProfileClient slug={resolvedParams.slug} />
    </div>
  );
}