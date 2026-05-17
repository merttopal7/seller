"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FavoriteButton({
  adId,
  isFavorited,
}: {
  adId: string;
  isFavorited: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ads/${adId}/favorite`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant="outline"
      className={`w-full gap-2 ${favorited ? "text-red-500 border-red-200" : ""}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : ""}`} />
      )}
      {favorited ? "Remove from Favorites" : "Save to Favorites"}
    </Button>
  );
}
