import { notFound } from "next/navigation";
import { getAdminUser } from "@/utils/supabase/admin-auth";
import { getAdminBadges } from "@/actions/admin/analytics";
import AdminSidebar from "./_components/AdminSidebar";

export const metadata = {
  title: "GOAT Rank | Command",
  robots: { index: false, follow: false },
};

// Every admin read hits live tables; nothing here is safe to prerender.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();

  // 404 rather than redirect: a signed-in non-admin should not learn that
  // /admin is a real route.
  if (!admin) notFound();

  // Two cheap head-only counts, so the nav badges work without every section
  // loading its full dataset.
  const badges = await getAdminBadges();

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row">
      <AdminSidebar adminName={admin.username ?? "Operator"} badges={badges} />
      <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8 pb-28">{children}</main>
    </div>
  );
}
