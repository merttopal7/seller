import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Eye, Heart, ListFilter } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

export default async function UserDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

  const [adsRes, favoritesRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/ads?seller=${session.id}`, { cache: "no-store" }),
    fetch(`${BACKEND_URL}/api/ads?favoritesOf=${session.id}`, { cache: "no-store" }),
  ]);

  const adsData = await adsRes.json().catch(() => ({ ads: [] }));
  const favoritesData = await favoritesRes.json().catch(() => ({ ads: [] }));

  const ads = adsData.ads || [];
  const favoritesCount = (favoritesData.ads || []).length;

  const stats = {
    total: ads.length,
    active: ads.filter((a: any) => a.status === "ACTIVE").length,
    pending: ads.filter((a: any) => a.status === "PENDING").length,
    views: ads.reduce((acc: number, curr: any) => acc + (curr.views || 0), 0),
    favorites: favoritesCount,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session.name}. Manage your listings and view performance.
          </p>
        </div>
        <Link href="/ads/create">
          <Button variant="gradient" className="gap-1.5 w-full md:w-auto">
            <PlusCircle className="h-4 w-4" /> Create New Ad
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Total Ads
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Active Listings
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Total Views
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{stats.views}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Favorites Received
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-red-500">{stats.favorites}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* listings section */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-lg">My Ads Listings</h2>
          <Link href="/favorites">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Heart className="h-4 w-4" /> View Saved Favorites
            </Button>
          </Link>
        </div>

        {ads.length > 0 ? (
          <div className="divide-y divide-border">
            {ads.map((ad: any) => (
              <div key={ad.id} className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-4 items-center min-w-0">
                  <div className="relative h-16 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img
                      src={ad.images[0]?.url || `https://picsum.photos/seed/${ad.id}/160/120`}
                      alt={ad.title}
                      className="object-cover h-full w-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base truncate hover:text-primary transition-colors">
                      <Link href={`/ads/${ad.id}`}>{ad.title}</Link>
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {formatPrice(ad.price, ad.currency)}
                      </span>
                      <span>•</span>
                      <span>{ad.category.name}</span>
                      <span>•</span>
                      <span>Views: {ad.views}</span>
                      <span>•</span>
                      <span>Posted: {formatDate(ad.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <Badge
                    variant={
                      ad.status === "ACTIVE"
                        ? "success"
                        : ad.status === "PENDING"
                        ? "warning"
                        : ad.status === "DRAFT"
                        ? "outline"
                        : "destructive"
                    }
                  >
                    {ad.status}
                  </Badge>

                  <div className="flex gap-1.5">
                    <Link href={`/ads/${ad.id}`}>
                      <Button variant="ghost" size="icon" title="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/ads/${ad.id}/edit`}>
                      <Button variant="ghost" size="icon" title="Edit listing">
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                    </Link>
                    {/* server action for delete can be triggered or hit API */}
                    <form action={`/api/ads/${ad.id}`} method="POST" className="inline">
                      {/* Using delete route with post override or plain fetch */}
                      <DeleteAdButton adId={ad.id} />
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <PlusCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No ads created yet</p>
            <p className="text-sm mt-1">Start selling your products by posting your first ad.</p>
            <Link href="/ads/create" className="mt-4 inline-block">
              <Button variant="gradient">Create an Ad Now</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline Client Component for deleting ad to keep file direct
import { DeleteAdButton } from "./delete-button";
