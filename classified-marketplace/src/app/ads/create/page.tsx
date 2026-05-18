import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CreateAdForm } from "./create-form";

export default async function CreateAdPage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

  const categoriesRes = await fetch(`${BACKEND_URL}/api/categories`, { cache: "no-store" });
  const categoriesData = await categoriesRes.json().catch(() => ({ categories: [] }));
  const categories = categoriesData.categories || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Post an Ad</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Provide accurate details about your product or service to attract buyers.
        </p>
      </div>

      <CreateAdForm categories={categories} />
    </div>
  );
}
