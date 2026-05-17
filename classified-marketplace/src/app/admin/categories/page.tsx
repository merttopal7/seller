import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CategoryManager } from "./category-manager";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

async function getCategories() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch admin categories");
    }

    const data = await res.json();
    return data.categories || [];
  } catch (error) {
    console.error("Failed to load admin categories:", error);
    return [];
  }
}

export default async function AdminCategoriesPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const categories = await getCategories();

  return <CategoryManager initialCategories={categories} />;
}
