import Link from "next/link";
import { AdCard } from "@/components/ads/ad-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/category-icon";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

async function getHomepageData() {
  try {
    const [categoriesRes, latestAdsRes, featuredAdsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/categories`, { next: { revalidate: 60 } }),
      fetch(`${BACKEND_URL}/api/ads?limit=8`, { next: { revalidate: 10 } }),
      fetch(`${BACKEND_URL}/api/ads?featured=true&limit=4`, { next: { revalidate: 10 } }),
    ]);

    const categoriesData = await categoriesRes.json().catch(() => ({ categories: [] }));
    const latestAdsData = await latestAdsRes.json().catch(() => ({ ads: [] }));
    const featuredAdsData = await featuredAdsRes.json().catch(() => ({ ads: [] }));

    // Format categories to match page expectations
    const rootCategories = (categoriesData.categories || [])
      .filter((cat: any) => !cat.parentId)
      .slice(0, 8)
      .map((cat: any) => ({
        ...cat,
        _count: { ads: cat.count || 0 }
      }));

    return {
      categories: rootCategories,
      latestAds: latestAdsData.ads || [],
      featuredAds: featuredAdsData.ads || [],
    };
  } catch (error) {
    console.error("Failed to fetch homepage data from backend:", error);
    return { categories: [], latestAds: [], featuredAds: [] };
  }
}

export default async function HomePage() {
  const { categories, latestAds, featuredAds } = await getHomepageData();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/marketplace/1920/600')] bg-cover bg-center opacity-10" />
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Buy & Sell Anything{" "}
              <span className="text-blue-200">Locally</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8 leading-relaxed">
              Discover thousands of classified ads near you. Post your first ad
              for free in just 2 minutes.
            </p>

            {/* Hero Search */}
            <form action="/listings" method="GET" className="flex gap-2 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  name="q"
                  type="search"
                  placeholder="What are you looking for?"
                  className="pl-10 h-12 text-base bg-white border-0 shadow-lg"
                />
              </div>
              <Button type="submit" size="lg" className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-lg h-12 px-6">
                Search
              </Button>
            </form>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-sm text-blue-200">
              <span>🚗 Vehicles</span>
              <span>🏠 Real Estate</span>
              <span>📱 Electronics</span>
              <span>👕 Fashion</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-background" style={{ borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }} />
      </section>

      {/* Stats Bar */}
      <section className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">50K+</p>
              <p className="text-sm text-muted-foreground">Active Ads</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">12K+</p>
              <p className="text-sm text-muted-foreground">Sellers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">100+</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Browse Categories</h2>
          <Link href="/listings" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/listings?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm transition-all duration-200 group text-center"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors text-primary">
                <CategoryIcon name={cat.icon} image={cat.image} className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium leading-tight">{cat.name}</span>
              <span className="text-xs text-muted-foreground">{cat._count.ads} ads</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Ads */}
      {featuredAds.length > 0 && (
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-amber-500">⭐</span>
                <h2 className="text-2xl font-bold">Featured Ads</h2>
              </div>
              <Link href="/listings?featured=true" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                See all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {featuredAds.map((ad: any) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Ads */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Latest Ads</h2>
          <Link href="/listings?sort=newest" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {latestAds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {latestAds.map((ad: any) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No ads yet. Be the first to post!</p>
            <Link href="/ads/create">
              <Button className="mt-4" variant="gradient">Post an Ad</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Why Use Us */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">
            Why Choose MarketPlace?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-8 w-8 text-amber-500" />,
                title: "Fast & Free",
                desc: "Post your ad in 2 minutes. No listing fees for basic ads.",
              },
              {
                icon: <Shield className="h-8 w-8 text-green-500" />,
                title: "Safe Trading",
                desc: "All ads are manually reviewed. Trade with confidence.",
              },
              {
                icon: <TrendingUp className="h-8 w-8 text-blue-500" />,
                title: "Millions of Buyers",
                desc: "Reach thousands of potential buyers in your area daily.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to sell something?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Create your free account and post your first ad in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ads/create">
              <Button size="xl" className="bg-white text-primary hover:bg-blue-50">
                Post a Free Ad
              </Button>
            </Link>
            <Link href="/listings">
              <Button size="xl" variant="outline" className="border-white text-white hover:bg-white/10">
                Browse All Ads
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
