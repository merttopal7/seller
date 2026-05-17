import { AdListItem } from "@/components/ads/ad-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Metadata } from "next";
import { CategoryIcon } from "@/components/ui/category-icon";
import { LocationFilters } from "@/components/ads/location-filters";
import { MobileFilterToggle } from "@/components/ads/mobile-filter-toggle";
import { SortSelect } from "@/components/ads/sort-select";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

export const metadata: Metadata = {
  title: "Browse Ads",
  description: "Browse all classified ads. Filter by category, location, price.",
};

interface SearchParams {
  q?: string;
  category?: string;
  country?: string;
  state?: string;
  city?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
  featured?: string;
  [key: string]: string | undefined;
}

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

function getAllFiltersForCategory(allCategories: any[], categoryId: string): any[] {
  const chain: any[] = [];
  let current = allCategories.find((c: any) => c.id === categoryId);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? allCategories.find((c: any) => c.id === current.parentId) : null;
  }
  const seen = new Set<string>();
  const filters: any[] = [];
  for (const cat of chain) {
    for (const f of cat.customFilters || []) {
      if (!seen.has(f.name)) {
        seen.add(f.name);
        filters.push(f);
      }
    }
  }
  return filters;
}

async function getListings(params: SearchParams) {
  const q = params.q || "";
  const categorySlug = params.category || "";
  const country = params.country || "";
  const state = params.state || "";
  const city = params.city || "";
  const location = params.location || "";
  const minPrice = params.minPrice || "";
  const maxPrice = params.maxPrice || "";
  const sort = params.sort || "newest";
  const page = params.page || "1";

  const hasAnyFilter =
    q || categorySlug || country || state || city || location || minPrice || maxPrice ||
    Object.keys(params).some((k) => k.startsWith("cf_"));

  const queryParams = new URLSearchParams({
    q,
    category: categorySlug,
    country,
    state,
    city,
    location,
    minPrice,
    maxPrice,
    sort,
    page,
    limit: "12",
    ...(!hasAnyFilter ? { featured: "true" } : {}),
  });

  // Append dynamic custom filters (cf_*)
  Object.entries(params).forEach(([key, val]) => {
    if (key.startsWith("cf_") && val) {
      queryParams.append(key, val);
    }
  });

  try {
    const [adsRes, categoriesRes, locationsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/ads?${queryParams.toString()}`, { cache: "no-store" }),
      fetch(`${BACKEND_URL}/api/categories`, { next: { revalidate: 60 } }),
      fetch(`${BACKEND_URL}/api/locations`, { next: { revalidate: 60 } }),
    ]);

    const adsData = await adsRes.json().catch(() => ({ ads: [], pagination: { total: 0, totalPages: 1 } }));
    const categoriesData = await categoriesRes.json().catch(() => ({ categories: [] }));
    const locationsData = await locationsRes.json().catch(() => ({ countries: [] }));

    const allCategories = categoriesData.categories || [];
    const rootCategories = allCategories.filter((cat: any) => !cat.parentId);
    const selectedCatObj = allCategories.find((cat: any) => cat.slug === categorySlug);
    const selectedCatFilters = selectedCatObj ? getAllFiltersForCategory(allCategories, selectedCatObj.id) : null;

    return {
      ads: adsData.ads || [],
      total: adsData.pagination?.total || 0,
      categories: allCategories, // Return all categories so subcategories can be browsed if desired
      rootCategories,
      selectedCatFilters,
      locations: locationsData.countries || [],
      page: Number(page),
      limit: 12,
      totalPages: adsData.pagination?.totalPages || 1,
    };
  } catch (error) {
    console.error("Failed to fetch listings from backend:", error);
    return {
      ads: [],
      total: 0,
      categories: [],
      rootCategories: [],
      selectedCatFilters: null,
      locations: [],
      page: 1,
      limit: 12,
      totalPages: 1,
    };
  }
}

interface ListingsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams;
  const { ads, total, categories, rootCategories, selectedCatFilters, locations, page, limit, totalPages } = await getListings(params);

  const hasAnyFilter =
    params.q || params.category || params.country || params.state ||
    params.city || params.location || params.minPrice || params.maxPrice ||
    Object.keys(params).some((k) => k.startsWith("cf_"));

  const selectedCategoryPath = (() => {
    if (!params.category) return !hasAnyFilter ? "Featured" : "";
    const chain: string[] = [];
    let current = categories.find((c: any) => c.slug === params.category);
    while (current) {
      chain.unshift(current.name);
      current = current.parentId ? categories.find((c: any) => c.id === current.parentId) : null;
    }
    return chain.join(" › ");
  })();

  const activeFilters = [
    params.q && { key: "q", label: `Search: "${params.q}"` },
    params.category && { key: "category", label: `Category: ${params.category}` },
    params.country && { key: "country", label: `Country: ${params.country}` },
    params.state && { key: "state", label: `State: ${params.state}` },
    params.city && { key: "city", label: `City: ${params.city}` },
    params.location && { key: "location", label: `Area: ${params.location}` },
    params.minPrice && { key: "minPrice", label: `Min: $${params.minPrice}` },
    params.maxPrice && { key: "maxPrice", label: `Max: $${params.maxPrice}` },
    // Include custom dynamic filters in the active filters bar
    ...Object.entries(params)
      .filter(([k, v]) => k.startsWith("cf_") && v)
      .map(([k, v]) => {
        if (k.endsWith("_min")) return { key: k, label: `${k.slice(3, -4)} ≥ ${v}` };
        if (k.endsWith("_max")) return { key: k, label: `${k.slice(3, -4)} ≤ ${v}` };
        return { key: k, label: `${k.slice(3)}: ${v}` };
      }),
  ].filter(Boolean) as { key: string; label: string }[];

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = { ...params, ...overrides };
    const qs = Object.entries(p)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/listings${qs ? `?${qs}` : ""}`;
  };

  const currentSort = params.sort || "newest";
  const allSortOptions = [
    { value: "newest", label: "Newest", href: buildUrl({ sort: "newest", page: "1" }) },
    { value: "price_asc", label: "Price ↑", href: buildUrl({ sort: "price_asc", page: "1" }) },
    { value: "price_desc", label: "Price ↓", href: buildUrl({ sort: "price_desc", page: "1" }) },
    ...((selectedCatFilters || []) as any[])
      .filter((f) => f.type === "number")
      .flatMap((f) => [
        { value: `spec_${f.name}_asc`, label: `${f.name} ↑`, href: buildUrl({ sort: `spec_${f.name}_asc`, page: "1" }) },
        { value: `spec_${f.name}_desc`, label: `${f.name} ↓`, href: buildUrl({ sort: `spec_${f.name}_desc`, page: "1" }) },
      ]),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 shrink-0 lg:self-start lg:sticky lg:top-20">
          {/* spacer for the fixed mobile filter bar */}
          <div className="h-3 lg:hidden" />
          <MobileFilterToggle currentSort={currentSort} sortOptions={allSortOptions}>
          {/* Categories */}
          <div className="bg-card border border-border rounded-xl p-4">
            <CollapsibleSection
              mobileOnly
              defaultOpen={false}
              title={<h3 className="font-semibold text-sm">Categories</h3>}
              summary={selectedCategoryPath}
            >
            <div className="space-y-1">
              {(() => {
                const selectedCat = params.category
                  ? categories.find((c: any) => c.slug === params.category)
                  : null;

                // Drill-down anchor: if selected has children → show its children
                // Otherwise → show its parent's children (selected stays highlighted)
                let activeCat: any = null;
                if (selectedCat) {
                  const hasChildren = categories.some((c: any) => c.parentId === selectedCat.id);
                  activeCat = hasChildren
                    ? selectedCat
                    : selectedCat.parentId
                      ? categories.find((c: any) => c.id === selectedCat.parentId)
                      : null;
                }

                const children: any[] = activeCat
                  ? categories.filter((c: any) => c.parentId === activeCat.id)
                  : [];

                // Back destination: parent of activeCat, or "All Categories" if activeCat is root
                const backCat = activeCat?.parentId
                  ? categories.find((c: any) => c.id === activeCat.parentId)
                  : null;

                if (activeCat && children.length > 0) {
                  return (
                    <>
                      {/* Back link — goes to parent category or All Categories */}
                      <Link
                        href={backCat
                          ? buildUrl({ category: backCat.slug, page: "1" })
                          : buildUrl({ category: undefined, page: "1" })}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors mb-1"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        {backCat ? backCat.name : "Categories"}
                      </Link>
                      {/* "All X" — selects the anchor category itself */}
                      <Link
                        href={buildUrl({ category: activeCat.slug, page: "1" })}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                          params.category === activeCat.slug
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "hover:bg-muted"
                        }`}
                      >
                        <CategoryIcon name={activeCat.icon} image={activeCat.image} className="h-4 w-4" />
                        All {activeCat.name}
                      </Link>
                      {/* Children — show > arrow if they have their own children */}
                      <div className="pl-3 border-l border-border/70 ml-3 space-y-0.5 mt-0.5">
                        {children.map((sub: any) => {
                          const subHasChildren = categories.some((c: any) => c.parentId === sub.id);
                          return (
                            <Link
                              key={sub.id}
                              href={buildUrl({ category: sub.slug, page: "1" })}
                              className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                                params.category === sub.slug
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              <span>{sub.name}</span>
                              {subHasChildren && <ChevronRight className="h-3.5 w-3.5 opacity-40 shrink-0" />}
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  );
                }

                // Default: show root categories with > arrow if they have children
                return (
                  <>
                    <Link
                      href="/listings"
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                        !hasAnyFilter ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"
                      }`}
                    >
                      ⭐ Featured
                    </Link>
                    {rootCategories.map((cat: any) => {
                      const catHasChildren = categories.some((c: any) => c.parentId === cat.id);
                      return (
                        <Link
                          key={cat.id}
                          href={buildUrl({ category: cat.slug, featured: undefined, page: "1" })}
                          className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                            params.category === cat.slug
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "hover:bg-muted"
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <CategoryIcon name={cat.icon} image={cat.image} className="h-4 w-4 shrink-0" />
                            <span className="truncate">{cat.name}</span>
                          </span>
                          {catHasChildren && <ChevronRight className="h-3.5 w-3.5 opacity-40 shrink-0" />}
                        </Link>
                      );
                    })}
                  </>
                );
              })()}
            </div>
            </CollapsibleSection>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </h2>

            <form method="GET" action="/listings">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Keywords
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="q"
                      defaultValue={params.q}
                      placeholder="Search..."
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                </div>

                <LocationFilters
                  locations={locations}
                  defaultCountry={params.country}
                  defaultState={params.state}
                  defaultCity={params.city}
                  defaultLocation={params.location}
                />

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <Input
                      name="minPrice"
                      type="number"
                      defaultValue={params.minPrice}
                      placeholder="Min"
                      className="h-9 text-sm"
                    />
                    <Input
                      name="maxPrice"
                      type="number"
                      defaultValue={params.maxPrice}
                      placeholder="Max"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Dynamic Specifications Filters for Selected Category */}
                {selectedCatFilters && selectedCatFilters.length > 0 && (
                  <div className="border-t border-border pt-4 mt-2 space-y-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
                      Specifications
                    </span>
                    {selectedCatFilters.map((filter: any) => {
                      const paramKey = `cf_${filter.name}`;
                      const currentVal = params[paramKey] || "";
                      return (
                        <div key={filter.name}>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                            {filter.name}
                          </label>
                          {filter.type === "select" ? (
                            <select
                              name={paramKey}
                              defaultValue={currentVal}
                              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="">Any {filter.name}</option>
                              {filter.options?.map((opt: string) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : filter.type === "number" ? (
                            <div className="flex gap-2">
                              <Input
                                name={`cf_${filter.name}_min`}
                                type="number"
                                min="0"
                                defaultValue={params[`cf_${filter.name}_min`] || ""}
                                placeholder="Min"
                                className="h-9 text-sm"
                              />
                              <Input
                                name={`cf_${filter.name}_max`}
                                type="number"
                                min="0"
                                defaultValue={params[`cf_${filter.name}_max`] || ""}
                                placeholder="Max"
                                className="h-9 text-sm"
                              />
                            </div>
                          ) : (
                            <Input
                              name={paramKey}
                              type="text"
                              defaultValue={currentVal}
                              placeholder={`Any ${filter.name.toLowerCase()}`}
                              className="h-9 text-sm"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Keep existing non-filter params */}
                {params.category && (
                  <input type="hidden" name="category" value={params.category} />
                )}
                {params.sort && (
                  <input type="hidden" name="sort" value={params.sort} />
                )}

                <Button type="submit" className="w-full h-9 text-sm">
                  Apply Filters
                </Button>
              </div>
            </form>
          </div>
          </MobileFilterToggle>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <p className="text-sm text-muted-foreground">
                {total === 0
                  ? "0 ads found"
                  : `${((page - 1) * limit + 1).toLocaleString()}–${Math.min(page * limit, total).toLocaleString()} of ${total.toLocaleString()} ads`}
              </p>
            </div>

            {/* Sort — hidden on mobile (handled by the fixed filter bar) */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">Sort by:</span>
              <SortSelect options={allSortOptions} current={currentSort} />
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.map((f) => (
                <Badge key={f.key} variant="secondary" className="gap-1.5 py-1">
                  {f.label}
                  <Link href={buildUrl({ [f.key]: undefined, page: "1" })}>
                    <X className="h-3 w-3 hover:text-destructive" />
                  </Link>
                </Badge>
              ))}
              <Link href="/listings" className="text-xs text-muted-foreground hover:text-destructive underline">
                Clear all
              </Link>
            </div>
          )}

          {/* Ads List */}
          {ads.length > 0 ? (
            <div className="flex flex-col gap-3">
              {ads.map((ad: any) => (
                <AdListItem key={ad.id} ad={ad} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No ads found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search term</p>
              <Link href="/listings">
                <Button variant="outline" className="mt-4">Clear filters</Button>
              </Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Link href={buildUrl({ page: String(page - 1) })}>
                <Button variant="outline" size="icon" disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.min(
                  Math.max(page - 2, 1) + i,
                  totalPages
                );
                return (
                  <Link key={pageNum} href={buildUrl({ page: String(pageNum) })}>
                    <Button
                      variant={pageNum === page ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9"
                    >
                      {pageNum}
                    </Button>
                  </Link>
                );
              })}

              <Link href={buildUrl({ page: String(page + 1) })}>
                <Button variant="outline" size="icon" disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
