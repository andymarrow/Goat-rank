import CreateClient from "./_components/CreateClient";
import { getCategoryLabels } from "@/actions/getCategories";

export const dynamic = "force-dynamic";

export default async function CreateBattlePage() {
  const categories = await getCategoryLabels();

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex items-center justify-center p-4 md:p-8">
      <CreateClient categories={categories} />
    </div>
  );
}