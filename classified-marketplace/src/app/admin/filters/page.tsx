import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FilterManager } from "./filter-manager";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

async function getGlobalFilters() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

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

export default async function AdminFiltersPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const filters = await getGlobalFilters();

  return <FilterManager initialFilters={filters} />;
}
