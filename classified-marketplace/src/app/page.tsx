import Link from "next/link";
import { AdCard } from "@/components/ads/ad-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

function totalAdCount(catId: string, all: any[]): number {
  const cat = all.find((c) => c.id === catId);
  if (!cat) return 0;
  const children = all.filter((c) => c.parentId === catId);
  return (cat.count ?? 0) + children.reduce((sum, child) => sum + totalAdCount(child.id, all), 0);
}

async function getHomepageData(browseCat: string = "") {
  try {
    const [categoriesRes, featuredAdsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/categories`, { next: { revalidate: 60 } }),
      fetch(`${BACKEND_URL}/api/ads?featured=true&limit=4`, { next: { revalidate: 10 } }),
    ]);

    const categoriesData = await categoriesRes.json().catch(() => ({ categories: [] }));
    const featuredAdsData = await featuredAdsRes.json().catch(() => ({ ads: [] }));

    const allCategories: any[] = categoriesData.categories || [];

    let parentCat: any = null;
    let grandparentCat: any = null;
    let displayCategories: any[];

    if (browseCat) {
      parentCat = allCategories.find((c: any) => c.slug === browseCat) || null;
      if (parentCat?.parentId) {
        grandparentCat = allCategories.find((c: any) => c.id === parentCat.parentId) || null;
      }
      displayCategories = parentCat
        ? allCategories.filter((c: any) => c.parentId === parentCat.id)
        : allCategories.filter((c: any) => !c.parentId).slice(0, 8);
    } else {
      displayCategories = allCategories.filter((c: any) => !c.parentId).slice(0, 8);
    }

    const categories = displayCategories.map((cat: any) => ({
      ...cat,
      hasChildren: allCategories.some((c: any) => c.parentId === cat.id),
      _count: { ads: totalAdCount(cat.id, allCategories) },
    }));

    return {
      categories,
      parentCat,
      grandparentCat,
      featuredAds: featuredAdsData.ads || [],
    };
  } catch (error) {
    console.error("Failed to fetch homepage data from backend:", error);
    return { categories: [], parentCat: null, grandparentCat: null, featuredAds: [] };
  }
}

interface HomePageProps {
  searchParams: Promise<{ cat?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const browseCat = params.cat || "";
  const { categories, parentCat, grandparentCat, featuredAds } = await getHomepageData(browseCat);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-700 to-red-800">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/marketplace/1920/600')] bg-cover bg-center opacity-10" />
        <div className="relative container mx-auto px-4 pt-16 md:pt-16 pb-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Buy & Sell Anything{" "}
              <span className="text-orange-200">Locally</span>
            </h1>
            <p className="text-lg text-orange-100 mb-8 leading-relaxed">
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
              <Button type="submit" size="lg" className="bg-white hover:bg-orange-50 text-primary font-bold border-0 shadow-lg h-12 px-6">
                Search
              </Button>
            </form>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-sm text-orange-200">
              <span>Vehicles</span>
              <span>Real Estate</span>
              <span>Electronics</span>
              <span>Fashion</span>
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
          <div className="flex items-center gap-3">
            {parentCat && (
              <Link
                href={grandparentCat ? `/?cat=${grandparentCat.slug}` : "/"}
                scroll={false}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {grandparentCat ? grandparentCat.name : "Categories"}
              </Link>
            )}
            <h2 className="text-2xl font-bold">
              {parentCat ? parentCat.name : "Browse Categories"}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {parentCat && (
            <Link
              href={`/listings?category=${parentCat.slug}`}
              className="relative flex flex-col items-center gap-2 p-4 rounded-xl border border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all duration-200 group text-center"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors text-primary">
                <CategoryIcon name={parentCat.icon} image={parentCat.image} className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold leading-tight text-primary">All {parentCat.name}</span>
              <span className="text-xs text-muted-foreground">View all ads</span>
            </Link>
          )}
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={cat.hasChildren ? `/?cat=${cat.slug}` : `/listings?category=${cat.slug}`}
              scroll={false}
              className="relative flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm transition-all duration-200 group text-center"
            >
              {cat.hasChildren && (
                <ChevronRight className="absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary/60" />
              )}
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
        <section className="bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-rose-500/5 dark:from-amber-500/10 dark:via-orange-500/5 dark:to-rose-500/10 py-12 border-y border-border/50 dark:border-border/10">
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

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary to-rose-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to sell something?</h2>
          <p className="text-orange-100 mb-8 text-lg">
            Create your free account and post your first ad in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ads/create">
              <Button size="xl" className="bg-white text-primary hover:bg-orange-50">
                Post a Free Ad
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
