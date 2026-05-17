import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ImageGallery } from "@/components/ads/image-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  Eye,
  Heart,
  Share2,
  Phone,
  Flag,
  ChevronRight,
} from "lucide-react";
import { formatPrice, formatDate, formatRelativeDate } from "@/lib/utils";
import { AdDetailTabs } from "@/components/ads/ad-detail-tabs";
import { ContactSellerButton } from "@/components/messages/contact-seller-button";
import { FavoriteButton } from "@/components/ads/favorite-button";
import { MobileSellerDrawer } from "./_components/mobile-seller-drawer";
import type { Metadata } from "next";

interface AdPageProps {
  params: Promise<{ id: string }>;
}

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

export async function generateMetadata({ params }: AdPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND_URL}/api/ads/${id}`);
    if (!res.ok) return { title: "Ad Not Found" };
    const { ad } = await res.json();
    if (!ad) return { title: "Ad Not Found" };
    return {
      title: ad.title,
      description: ad.description.slice(0, 160),
      openGraph: {
        title: ad.title,
        description: ad.description.slice(0, 160),
        images: ad.images[0] ? [ad.images[0].url] : [],
      },
    };
  } catch {
    return { title: "Classified Ads Marketplace" };
  }
}

// Build full category ancestry: [root, ..., leaf]
function buildCategoryPath(categories: any[], categoryId: string): any[] {
  const result: any[] = [];
  let current = categories.find((c: any) => c.id === categoryId);
  while (current) {
    result.unshift(current);
    current = current.parentId ? categories.find((c: any) => c.id === current.parentId) : null;
  }
  return result;
}

// Resolve city name to full location hierarchy
function resolveLocationPath(countries: any[], cityName: string, neighborhood?: string) {
  for (const country of countries) {
    for (const state of country.states || []) {
      for (const city of state.cities || []) {
        if (city.name === cityName) {
          const parts: { label: string; href: string }[] = [
            { label: country.name, href: `/listings?country=${encodeURIComponent(country.name)}` },
            { label: state.name, href: `/listings?state=${encodeURIComponent(state.name)}` },
            { label: city.name, href: `/listings?city=${encodeURIComponent(city.name)}` },
          ];
          if (neighborhood) {
            parts.push({ label: neighborhood, href: `/listings?location=${encodeURIComponent(neighborhood)}` });
          }
          return parts;
        }
      }
    }
  }
  const parts: { label: string; href: string }[] = [
    { label: cityName, href: `/listings?city=${encodeURIComponent(cityName)}` },
  ];
  if (neighborhood) {
    parts.push({ label: neighborhood, href: `/listings?location=${encodeURIComponent(neighborhood)}` });
  }
  return parts;
}

export default async function AdDetailPage({ params }: AdPageProps) {
  const { id } = await params;
  const [session, adRes, catsRes, locsRes] = await Promise.all([
    getSession(),
    fetch(`${BACKEND_URL}/api/ads/${id}`, { cache: "no-store" }),
    fetch(`${BACKEND_URL}/api/categories`, { next: { revalidate: 60 } }),
    fetch(`${BACKEND_URL}/api/locations`, { next: { revalidate: 60 } }),
  ]);

  if (!adRes.ok) {
    notFound();
  }

  const { ad } = await adRes.json();

  if (!ad || (ad.status !== "ACTIVE" && ad.user.id !== session?.id && session?.role !== "ADMIN")) {
    notFound();
  }

  const allCategories = await catsRes.json().then((d: any) => d.categories || []).catch(() => []);
  const allCountries = await locsRes.json().then((d: any) => d.countries || []).catch(() => []);

  const categoryPath = buildCategoryPath(allCategories, ad.category.id);
  const locationPath = resolveLocationPath(allCountries, ad.city, ad.location || undefined);

// Check if favorited
  let isFavorited = false;
  if (session) {
    try {
      const favRes = await fetch(`${BACKEND_URL}/api/ads?favoritesOf=${session.id}`, { cache: "no-store" });
      const favData = await favRes.json().catch(() => ({ ads: [] }));
      isFavorited = (favData.ads || []).some((favAd: any) => favAd.id === id);
    } catch (err) {
      console.error("Failed to check favorite status:", err);
    }
  }

  const isOwner = session?.id === ad.user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center flex-wrap gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/listings" className="hover:text-foreground">Ads</Link>
        {categoryPath.map((cat: any) => (
          <Fragment key={cat.id}>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/listings?category=${cat.slug}`} className="hover:text-foreground">
              {cat.name}
            </Link>
          </Fragment>
        ))}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground truncate max-w-[200px]">{ad.title}</span>
      </nav>

      {ad.status !== "ACTIVE" && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          ⚠️ This ad is currently <strong>{ad.status}</strong> and not visible to others.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Images + Description */}
        <div className="lg:col-span-2 space-y-6">
          <ImageGallery images={ad.images} title={ad.title} />

          {/* Title & Price (mobile) */}
          <div className="lg:hidden">
            <h1 className="text-2xl font-bold mb-2">{ad.title}</h1>
            <p className="text-3xl font-bold text-primary mb-3">
              {formatPrice(ad.price, ad.currency)}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {locationPath.map((part, i) => (
                <Fragment key={part.href}>
                  {i > 0 && <span className="opacity-40">›</span>}
                  <span>{part.label}</span>
                </Fragment>
              ))}
            </div>
          </div>

          {/* Description + Details Tabs */}
          <AdDetailTabs labels={["Ad Details", "Description"]}>
            {/* Tab 0: Ad Details */}
            <div className="space-y-4 text-sm">

              {/* Other fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-muted-foreground">Posted</span>
                  <p className="font-medium mt-0.5">{formatDate(ad.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Views</span>
                  <p className="font-medium mt-0.5">{ad.views.toLocaleString()}</p>
                </div>
                {ad.customValues && Object.entries(ad.customValues).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-muted-foreground">{key}</span>
                    <p className="font-medium mt-0.5 text-primary">{String(val)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab 1: Description */}
            <div
              className="rich-text-render text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: ad.description }}
            />
          </AdDetailTabs>

          {/* Seller Info (mobile) — collapsible bottom drawer */}
          <div className="lg:hidden">
            <MobileSellerDrawer sellerName={ad.user.name}>
              <SellerCard user={ad.user} isFavorited={isFavorited} isOwner={isOwner} adId={id} session={session} />
            </MobileSellerDrawer>
          </div>
          {/* Spacer so content isn't hidden behind drawer handle */}
          <div className="lg:hidden h-14" />
        </div>

        {/* Right: Price + Seller sidebar */}
        <div className="space-y-4">
          {/* Price Card */}
          <div className="hidden lg:block bg-card border border-border rounded-xl p-5 sticky top-20">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-xl font-bold mb-1 leading-tight">{ad.title}</h1>
                <div className="flex items-center gap-1 flex-wrap text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {locationPath.map((part, i) => (
                    <Fragment key={part.href}>
                      {i > 0 && <span className="opacity-40">›</span>}
                      <span>{part.label}</span>
                    </Fragment>
                  ))}
                </div>
              </div>
              {ad.isFeatured && (
                <Badge className="bg-amber-500 text-white border-0">Featured</Badge>
              )}
            </div>

            <p className="text-3xl font-bold text-primary mb-4">
              {formatPrice(ad.price, ad.currency)}
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatRelativeDate(ad.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {ad.views} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {ad._count.favorites}
              </span>
            </div>

            <SellerCard user={ad.user} isFavorited={isFavorited} isOwner={isOwner} adId={id} session={session} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerCard({
  user,
  isFavorited,
  isOwner,
  adId,
  session,
}: {
  user: { id: string; name: string; avatar?: string | null; phone?: string | null; createdAt: Date };
  isFavorited: boolean;
  isOwner: boolean;
  adId: string;
  session: { id: string } | null;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm">{user.name}</p>
          <p className="text-xs text-muted-foreground">
            Member since {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {isOwner ? (
        <div className="space-y-2">
          <Link href={`/ads/${adId}/edit`}>
            <Button className="w-full" variant="outline">Edit Ad</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="w-full" variant="ghost">My Dashboard</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {user.phone && (
            <a href={`tel:${user.phone}`} className="block">
              <Button className="w-full gap-2">
                <Phone className="h-4 w-4" />
                {user.phone}
              </Button>
            </a>
          )}
          {session && (
            <ContactSellerButton adId={adId} sellerId={user.id} />
          )}
          {session && (
            <FavoriteButton adId={adId} isFavorited={isFavorited} />
          )}
          {!session && (
            <Link href="/auth/login">
              <Button variant="outline" className="w-full gap-2">
                <Heart className="h-4 w-4" /> Save to Favorites
              </Button>
            </Link>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs text-muted-foreground">
              <Flag className="h-3.5 w-3.5" /> Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
