import { notFound } from "next/navigation";
import { getAdminUser } from "@/utils/supabase/admin-auth";

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

  return <>{children}</>;
}
