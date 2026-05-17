import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { EditAdForm } from "./edit-form";

interface EditAdPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAdPage({ params }: EditAdPageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

  const [adRes, categoriesRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/ads/${id}`, { cache: "no-store" }),
    fetch(`${BACKEND_URL}/api/categories`, { cache: "no-store" }),
  ]);

  if (!adRes.ok) {
    notFound();
  }

  const { ad } = await adRes.json();
  const categoriesData = await categoriesRes.json().catch(() => ({ categories: [] }));
  const categories = categoriesData.categories || [];

  if (!ad) {
    notFound();
  }

  if (ad.userId !== session.id && session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Ad</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update the details of your listing. Changes will put the listing back into pending status.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <EditAdForm ad={ad} categories={categories} />
      </div>
    </div>
  );
}
