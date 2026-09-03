import ProfileClient from "./_components/ProfileClient";
import { getEntityProfileData } from "@/actions/getEntityProfile";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  // Fetch real entity data from Supabase!
  const profileData = await getEntityProfileData(resolvedParams.slug);

  if (!profileData) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h1 className="font-arcade text-2xl sm:text-3xl md:text-4xl mb-4 text-primary text-center px-4">PROFILE NOT FOUND</h1>
        <Link href="/" className="flex items-center gap-2 text-foreground/50 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> RETURN TO LOBBY
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-24 bg-background">
      <ProfileClient initialProfileData={profileData} />
    </div>
  );
}