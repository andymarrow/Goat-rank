import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Command centre",
  // Signed-in surface: nothing here belongs in a public result.
  robots: { index: false, follow: false },
};

import { redirect } from "next/navigation";
import { getDashboard } from "@/actions/getDashboard";
import { listAvatarOptions } from "@/actions/profile";
import DashboardClient from "./_components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, avatars] = await Promise.all([getDashboard(), listAvatarOptions()]);

  // Middleware already gates this route; this is the belt-and-braces check.
  if (!data) redirect("/login");

  return (
    <div className="w-full min-h-[calc(100vh-64px)] pb-24 font-sans">
      <DashboardClient data={data} avatars={avatars} />
    </div>
  );
}

