"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { cn, formatPrice, formatRelativeDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AdListItemProps {
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
    customValues?: Record<string, unknown>;
  };
  isFavorited?: boolean;
  onToggleFavorite?: (adId: string) => void;
  showFavorite?: boolean;
}

export function AdListItem({
  ad,
  isFavorited = false,
  onToggleFavorite,
  showFavorite = true,
}: AdListItemProps) {
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

  const specs = ad.customValues
    ? Object.entries(ad.customValues).filter(([, v]) => v !== "" && v !== null && v !== undefined)
    : [];

  return (
    <Link href={`/ads/${ad.id}`} className="group block">
      <div className="flex gap-3 rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all duration-200 hover:border-primary/30 p-3">
        {/* Thumbnail */}
        <div className="relative shrink-0 w-28 h-20 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={ad.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 112px, 144px"
          />
          {ad.isFeatured && (
            <div className="absolute top-1 left-1">
              <Badge className="bg-amber-500 text-white border-0 text-[10px] px-1.5 py-0 leading-5 font-semibold">
                ⭐ Featured
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
          {/* Top row: title + favorite */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {ad.title}
            </h3>
            {showFavorite && (
              <button
                onClick={handleFavorite}
                className={cn(
                  "shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-all duration-200",
                  favorited
                    ? "bg-red-500 text-white"
                    : "text-muted-foreground hover:text-red-500"
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", favorited && "fill-current")} />
              </button>
            )}
          </div>

          {/* Price */}
          <p className="text-base font-bold text-primary leading-none">
            {formatPrice(ad.price, ad.currency)}
          </p>

          {/* Specs */}
          {specs.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {specs.slice(0, 5).map(([key, val]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                >
                  <span className="font-medium text-foreground">{key}:</span>
                  {String(val)}
                </span>
              ))}
              {specs.length > 5 && (
                <span className="text-[11px] text-muted-foreground px-1">
                  +{specs.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Bottom row: category, location, date */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="text-[11px] py-0 h-5">
              {ad.category.name}
            </Badge>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {ad.city}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              {formatRelativeDate(ad.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
