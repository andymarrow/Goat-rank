import CreateClient from "./_components/CreateClient";
import { getCategoryLabels } from "@/actions/getCategories";

export const dynamic = "force-dynamic";

export default async function CreateBattlePage() {
  const categories = await getCategoryLabels();

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex items-start md:items-center justify-center px-3 py-5 md:p-8">
      <CreateClient categories={categories} />
    </div>
  );
}