import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { FilterEditor } from "./filter-editor";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

async function getCategory(id: string, token: string | undefined) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/categories/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch admin category details");
    }

    const data = await res.json();
    return data.category;
  } catch (error) {
    console.error("Failed to load admin category details:", error);
    return null;
  }
}

async function getCategories(token: string | undefined) {
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

async function getGlobalFilters(token: string | undefined) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/filters`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch global specifications");
    }

    const data = await res.json();
    return data.filters || [];
  } catch (error) {
    console.error("Failed to load global specifications pool:", error);
    return [];
  }
}

export default async function AdminCategoryEditPage({ params }: EditPageProps) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  const [category, globalFilters, categories] = await Promise.all([
    getCategory(id, token),
    getGlobalFilters(token),
    getCategories(token),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <FilterEditor
      category={category}
      globalFilters={globalFilters}
      categories={categories}
    />
  );
}
