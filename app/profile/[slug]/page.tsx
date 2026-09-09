import type { Metadata } from "next";
import ProfileClient from "./_components/ProfileClient";
import { getEntityProfileData } from "@/actions/getEntityProfile";
import { absolute, breadcrumbSchema, jsonLd } from "@/lib/seo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const money = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

/**
 * A contender page ranks for the contender's name, which is the search a
 * person actually makes: they look up "Messi", not "crowdfunded leaderboard".
 * The title leads with the name and the description states the one number
 * this page knows that no other page does.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getEntityProfileData(slug);

  if (!profile) return { title: "Contender not found", robots: { index: false } };

  const title = `${profile.name}: backed with ${money(profile.totalRaised ?? 0)} on GOAT Rank`;
  const description = `${profile.name} has been backed with ${money(
    profile.totalRaised ?? 0
  )} across GOAT Rank arenas. See who is backing them, read the battle cries, and pledge for them yourself. 30% of every pledge goes to charity.`;

  return {
    title: profile.name,
    description,
    alternates: { canonical: absolute(`/profile/${slug}`) },
    openGraph: {
      title,
      description,
      type: "profile",
      url: absolute(`/profile/${slug}`),
      ...(profile.image ? { images: [{ url: profile.image }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

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

  const schema = jsonLd(
    {
      "@type": "Thing",
      "@id": absolute(`/profile/${resolvedParams.slug}#contender`),
      name: profileData.name,
      description: `${profileData.name} is a contender on GOAT Rank, backed with ${money(
        profileData.totalRaised ?? 0
      )} across its arenas.`,
      url: absolute(`/profile/${resolvedParams.slug}`),
      ...(profileData.image ? { image: profileData.image } : {}),
      ...(profileData.category ? { additionalType: profileData.category } : {}),
    },
    breadcrumbSchema([
      { name: "GOAT Rank", path: "/" },
      { name: "Roster", path: "/profile" },
      { name: profileData.name, path: `/profile/${resolvedParams.slug}` },
    ])
  );

  return (
    <div className="w-full min-h-screen pb-24 bg-background font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <ProfileClient initialProfileData={profileData} />
    </div>
  );
}