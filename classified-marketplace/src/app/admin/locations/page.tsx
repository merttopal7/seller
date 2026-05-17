import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LocationManager } from "./location-manager";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

async function getLocations() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/locations`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch locations");
    }

    const data = await res.json();
    return data.countries || [];
  } catch (error) {
    console.error("Failed to load locations:", error);
    return [];
  }
}

export default async function AdminLocationsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const countries = await getLocations();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manage Locations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure countries, cities, and their neighborhoods. These options populate the seller listing forms and search criteria.
          </p>
        </div>
      </div>

      <LocationManager initialCountries={countries} />
    </div>
  );
}
