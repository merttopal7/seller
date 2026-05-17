import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdCard } from "@/components/ads/ad-card";
import { Heart } from "lucide-react";

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

  const res = await fetch(`${BACKEND_URL}/api/ads?favoritesOf=${session.id}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({ ads: [] }));
  const favorites = data.ads || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-red-500 fill-red-500 animate-pulse" /> Saved Ads
        </h1>
        <p className="text-muted-foreground mt-1">
          Keep track of ads you are interested in.
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((ad: any) => (
            <AdCard key={ad.id} ad={ad} isFavorited={true} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground bg-card border rounded-2xl">
          <Heart className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No saved ads yet</p>
          <p className="text-sm mt-1">Browse ads and click the heart icon to save listings here.</p>
        </div>
      )}
    </div>
  );
}
