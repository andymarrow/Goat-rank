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
      <div className="w-full h-screen flex flex-col items-center justify-center bg-background text-foreground font-sans">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 text-primary text-center px-4 tracking-tight uppercase">
          PROFILE NOT FOUND
        </h1>
        <Link
          href="/"
          className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card hover:bg-card/80 border border-border/80 text-foreground text-xs font-bold tracking-wider transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:-translate-x-0.5 transition-all" />
          <span>RETURN TO LOBBY</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-24 bg-background font-sans">
      <ProfileClient initialProfileData={profileData} />
    </div>
  );
}