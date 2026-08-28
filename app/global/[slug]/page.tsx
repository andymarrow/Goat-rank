import GlobalRoomClient from "./_components/GlobalRoomClient";

export default function GlobalRoomPage({ params }: { params: { slug: string } }) {
  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col items-center">
      <GlobalRoomClient slug={params.slug} />
    </div>
  );
}