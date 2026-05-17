"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { cn, formatPrice, formatRelativeDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AdCardProps {
  ad: {
    id: string;
    title: string;
    price: number;
    currency: string;
    city: string;
    location: string;
    createdAt: Date | string;
    isFeatured: boolean;
    images: { url: string }[];
    category: { name: string; slug: string };
  };
  isFavorited?: boolean;
  onToggleFavorite?: (adId: string) => void;
  showFavorite?: boolean;
}

export function AdCard({
  ad,
  isFavorited = false,
  onToggleFavorite,
  showFavorite = true,
}: AdCardProps) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [imgError, setImgError] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onToggleFavorite) return;
    setFavorited((f) => !f);
    onToggleFavorite(ad.id);
  };

  const imageUrl =
    !imgError && ad.images.length > 0
      ? ad.images[0].url
      : `https://picsum.photos/seed/${ad.id}/400/300`;

  return (
    <Link href={`/ads/${ad.id}`} className="group block">
      <div className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={ad.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {ad.isFeatured && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-amber-500 text-white border-0 text-xs font-semibold">
                ⭐ Featured
              </Badge>
            </div>
          )}
          {showFavorite && (
            <button
              onClick={handleFavorite}
              className={cn(
                "absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200",
                favorited
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-muted-foreground hover:text-red-500 hover:bg-white"
              )}
            >
              <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {ad.title}
            </h3>
          </div>

          <p className="text-lg font-bold text-primary mb-2">
            {formatPrice(ad.price, ad.currency)}
          </p>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{ad.city}</span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <Badge variant="secondary" className="text-xs">
              {ad.category.name}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeDate(ad.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
