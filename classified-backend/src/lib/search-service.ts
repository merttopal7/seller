import { esClient, ADS_INDEX, ensureAdsIndex } from "./elasticsearch.js";
import { prisma } from "./prisma.js";

const AD_INDEX_SELECT = {
  id: true,
  title: true,
  description: true,
  price: true,
  currency: true,
  city: true,
  state: true,
  country: true,
  location: true,
  categoryId: true,
  category: { select: { slug: true } },
  userId: true,
  status: true,
  isFeatured: true,
  customValues: true,
  createdAt: true,
  views: true,
} as const;

function toDocument(ad: any) {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    currency: ad.currency,
    city: ad.city,
    state: ad.state ?? null,
    country: ad.country,
    location: ad.location,
    categoryId: ad.categoryId,
    categorySlug: ad.category.slug,
    userId: ad.userId,
    status: ad.status,
    isFeatured: ad.isFeatured,
    customValues: ad.customValues ? JSON.parse(ad.customValues) : {},
    createdAt: new Date(ad.createdAt).toISOString(),
    views: ad.views,
  };
}

export async function indexAd(adId: string): Promise<void> {
  const ad = await prisma.ad.findUnique({ where: { id: adId }, select: AD_INDEX_SELECT });
  if (!ad) return;
  await esClient.index({ index: ADS_INDEX, id: ad.id, document: toDocument(ad) });
}

export async function deleteAdFromIndex(adId: string): Promise<void> {
  try {
    await esClient.delete({ index: ADS_INDEX, id: adId });
  } catch (e: any) {
    if (e?.meta?.statusCode !== 404) throw e;
  }
}

export interface SearchAdsParams {
  q?: string;
  categoryIds?: string[];
  cities?: string[];
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  sellerId?: string;
  favoriteIds?: string[];
  customFilters?: Record<string, string>;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function searchAds(
  params: SearchAdsParams
): Promise<{ ids: string[]; total: number }> {
  const {
    q,
    categoryIds,
    cities,
    location,
    minPrice,
    maxPrice,
    isFeatured,
    sellerId,
    favoriteIds,
    customFilters = {},
    sort = "newest",
    page = 1,
    limit = 12,
  } = params;

  // Short-circuit: favoritesOf requested but user has no favorites
  if (favoriteIds !== undefined && favoriteIds.length === 0) {
    return { ids: [], total: 0 };
  }

  const must: any[] = [];
  const filter: any[] = [];

  if (q) {
    must.push({
      bool: {
        should: [
          {
            multi_match: {
              query: q,
              fields: ["title^3", "description"],
              type: "best_fields",
              fuzziness: "AUTO",
            },
          },
          { match_phrase_prefix: { title: { query: q, boost: 3 } } },
          { match_phrase_prefix: { description: { query: q } } },
        ],
        minimum_should_match: 1,
      },
    });
  }

  // Status / seller
  if (sellerId) {
    filter.push({ term: { userId: sellerId } });
  } else {
    filter.push({ term: { status: "ACTIVE" } });
  }

  if (isFeatured) filter.push({ term: { isFeatured: true } });

  if (categoryIds && categoryIds.length > 0) {
    filter.push({ terms: { categoryId: categoryIds } });
  }

  if (cities && cities.length > 0) {
    filter.push({ terms: { city: cities } });
  }

  if (location) {
    filter.push({ match: { location } });
  }

  const priceRange: any = {};
  if (minPrice && minPrice > 0) priceRange.gte = minPrice;
  if (maxPrice !== undefined) priceRange.lte = maxPrice;
  if (Object.keys(priceRange).length > 0) {
    filter.push({ range: { price: priceRange } });
  }

  if (favoriteIds && favoriteIds.length > 0) {
    filter.push({ terms: { id: favoriteIds } });
  }

  // Text custom field equality (flattened type supports term queries)
  for (const [key, val] of Object.entries(customFilters)) {
    if (val) filter.push({ term: { [`customValues.${key}`]: val } });
  }

  // Sort (score-first when text query present)
  let esSort: any[];
  if (q) {
    esSort = [{ _score: "desc" }, { createdAt: "desc" }];
  } else if (sort === "price_asc") {
    esSort = [{ price: "asc" }];
  } else if (sort === "price_desc") {
    esSort = [{ price: "desc" }];
  } else {
    esSort = [{ createdAt: "desc" }];
  }

  const response = await esClient.search({
    index: ADS_INDEX,
    from: (page - 1) * limit,
    size: limit,
    query: {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        filter,
      },
    },
    sort: esSort,
  });

  const total =
    typeof response.hits.total === "number"
      ? response.hits.total
      : (response.hits.total?.value ?? 0);

  const ids = response.hits.hits.map((h) => h._id as string);
  return { ids, total };
}

export async function reindexAll(): Promise<number> {
  // Drop and recreate index with current mapping
  try {
    await esClient.indices.delete({ index: ADS_INDEX });
  } catch {}
  await ensureAdsIndex();

  const ads = await prisma.ad.findMany({ select: AD_INDEX_SELECT });
  if (ads.length === 0) return 0;

  const operations = ads.flatMap((ad) => [
    { index: { _index: ADS_INDEX, _id: ad.id } },
    toDocument(ad),
  ]);

  await esClient.bulk({ operations, refresh: true });
  console.log(`✅ Reindexed ${ads.length} ads`);
  return ads.length;
}
