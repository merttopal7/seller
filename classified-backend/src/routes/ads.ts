import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { adSchema } from "../lib/validations.js";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth.js";
import { indexAd, deleteAdFromIndex, searchAds } from "../lib/search-service.js";

const router = Router();

const AD_SELECT = {
  id: true,
  title: true,
  price: true,
  currency: true,
  city: true,
  location: true,
  status: true,
  isFeatured: true,
  views: true,
  createdAt: true,
  customValues: true,
  images: { select: { id: true, url: true, order: true }, orderBy: { order: "asc" as const } },
  category: { select: { id: true, name: true, slug: true, customFilters: { select: { id: true, name: true, type: true, options: true } } } },
  user: { select: { id: true, name: true, avatar: true } },
};

const AD_FULL_SELECT = {
  id: true,
  title: true,
  description: true,
  price: true,
  currency: true,
  city: true,
  state: true,
  country: true,
  location: true,
  latitude: true,
  longitude: true,
  status: true,
  isFeatured: true,
  views: true,
  createdAt: true,
  updatedAt: true,
  customValues: true,
  userId: true,
  images: { select: { id: true, url: true, order: true }, orderBy: { order: "asc" as const } },
  category: { select: { id: true, name: true, slug: true, customFilters: { select: { id: true, name: true, type: true, options: true } } } },
  user: { select: { id: true, name: true, avatar: true, phone: true, createdAt: true } },
  _count: { select: { favorites: true } },
};

function formatAd(ad: any) {
  if (!ad) return null;
  return {
    ...ad,
    customValues: ad.customValues ? JSON.parse(ad.customValues) : {},
    category: ad.category ? {
      ...ad.category,
      customFilters: ad.category.customFilters
        ? ad.category.customFilters.map((f: any) => ({
            name: f.name,
            type: f.type,
            options: f.options ? f.options.split(",").map((o: any) => o.trim()) : [],
          }))
        : [],
    } : null,
  };
}

function collectDescendantIds(allCats: { id: string; parentId: string | null }[], rootId: string): string[] {
  const ids: string[] = [rootId];
  for (const cat of allCats) {
    if (cat.parentId === rootId) ids.push(...collectDescendantIds(allCats, cat.id));
  }
  return ids;
}

// GET / - Search and filter ads via Elasticsearch
router.get("/", async (req, res) => {
  try {
    const q            = (req.query.q as string) || "";
    const category     = (req.query.category as string) || "";
    const country      = (req.query.country as string) || "";
    const state        = (req.query.state as string) || "";
    const city         = (req.query.city as string) || "";
    const location     = (req.query.location as string) || "";
    const seller       = (req.query.seller as string) || "";
    const favoritesOf  = (req.query.favoritesOf as string) || "";
    const featured     = req.query.featured === "true";
    const minPrice     = Number(req.query.minPrice) || 0;
    const maxPrice     = Number(req.query.maxPrice) || Infinity;
    const sort         = (req.query.sort as string) || "newest";
    const page         = Math.max(1, Number(req.query.page) || 1);
    const limit        = Math.min(24, Number(req.query.limit) || 12);

    // Parse custom field filters
    const customFilters: Record<string, string> = {};
    const customFiltersMin: Record<string, number> = {};
    const customFiltersMax: Record<string, number> = {};

    for (const key of Object.keys(req.query)) {
      if (!key.startsWith("cf_")) continue;
      if (key.endsWith("_min")) {
        const name = key.slice(3, -4);
        const v = Number(req.query[key]);
        if (!isNaN(v)) customFiltersMin[name] = v;
      } else if (key.endsWith("_max")) {
        const name = key.slice(3, -4);
        const v = Number(req.query[key]);
        if (!isNaN(v)) customFiltersMax[name] = v;
      } else {
        customFilters[key.slice(3)] = req.query[key] as string;
      }
    }

    // Resolve city names from country/state hierarchy
    let cities: string[] | undefined;
    if (city) {
      cities = [city];
    } else if (state || country) {
      const matched = await prisma.city.findMany({
        where: {
          state: {
            ...(state ? { name: state } : {}),
            ...(country ? { country: { name: country } } : {}),
          },
        },
        select: { name: true },
      });
      cities = matched.map((c) => c.name);
    }

    // Resolve category IDs (root + all descendants)
    let categoryIds: string[] | undefined;
    if (category) {
      const allCats = await prisma.category.findMany({ select: { id: true, parentId: true, slug: true } });
      const root = allCats.find((c) => c.slug === category);
      if (!root) {
        return res.json({ ads: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
      categoryIds = collectDescendantIds(allCats, root.id);
    }

    // Resolve favorite IDs
    let favoriteIds: string[] | undefined;
    if (favoritesOf) {
      const favs = await prisma.favorite.findMany({ where: { userId: favoritesOf }, select: { adId: true } });
      favoriteIds = favs.map((f) => f.adId);
      if (favoriteIds.length === 0) {
        return res.json({ ads: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
    }

    // Query Elasticsearch (with Prisma fallback if ES is unavailable)
    let formattedAds: any[];
    let total = 0;

    let esAvailable = true;
    let ids: string[] = [];

    try {
      ({ ids, total } = await searchAds({
        q,
        categoryIds,
        cities,
        location,
        minPrice,
        maxPrice: maxPrice === Infinity ? undefined : maxPrice,
        isFeatured: featured || undefined,
        sellerId: seller || undefined,
        favoriteIds,
        customFilters,
        sort,
        page,
        limit,
      }));
    } catch {
      esAvailable = false;
    }

    if (!esAvailable) {
      // ── Prisma fallback ──────────────────────────────────────────────────────
      const resolvedCityFilter = cities
        ? cities.length === 1 ? { contains: cities[0] } : { in: cities }
        : undefined;

      const orderBy =
        sort === "price_asc" ? { price: "asc" as const }
        : sort === "price_desc" ? { price: "desc" as const }
        : { createdAt: "desc" as const };

      const where: any = {
        ...(seller ? { userId: seller } : { status: "ACTIVE" }),
        ...(featured && { isFeatured: true }),
        ...(favoritesOf && favoriteIds && { id: { in: favoriteIds } }),
        ...(q && { OR: [{ title: { contains: q } }, { description: { contains: q } }] }),
        ...(categoryIds && { categoryId: { in: categoryIds } }),
        price: { gte: minPrice, ...(maxPrice !== Infinity && { lte: maxPrice }) },
        ...(resolvedCityFilter && { city: resolvedCityFilter }),
        ...(location && { location: { contains: location } }),
      };

      const allAds = await prisma.ad.findMany({ where, select: AD_SELECT, orderBy });
      formattedAds = allAds.map(formatAd).filter(Boolean);
      total = formattedAds.length;

      const skip = (page - 1) * limit;
      formattedAds = formattedAds.slice(skip, skip + limit);

      return res.json({
        ads: formattedAds,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    if (ids.length === 0) {
      return res.json({ ads: [], pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    // Fetch full ad data from Prisma, preserving ES relevance order
    const adMap = new Map(
      (await prisma.ad.findMany({ where: { id: { in: ids } }, select: AD_SELECT }))
        .map((a) => [a.id, a])
    );

    formattedAds = ids
      .map((id) => adMap.get(id))
      .filter(Boolean)
      .map(formatAd)
      .filter(Boolean);

    // Numeric custom field range filtering (ES flattened type treats values as keywords)
    const hasNumericFilters =
      Object.keys(customFiltersMin).length > 0 || Object.keys(customFiltersMax).length > 0;

    if (hasNumericFilters) {
      formattedAds = formattedAds.filter((ad: any) => {
        for (const [key, min] of Object.entries(customFiltersMin)) {
          const v = Number(ad.customValues?.[key]);
          if (isNaN(v) || v < min) return false;
        }
        for (const [key, max] of Object.entries(customFiltersMax)) {
          const v = Number(ad.customValues?.[key]);
          if (isNaN(v) || v > max) return false;
        }
        return true;
      });
    }

    // In-memory sort for spec_ fields
    if (sort.startsWith("spec_")) {
      const parts = sort.slice(5).split("_");
      const dir = parts.pop();
      const specName = parts.join("_");
      formattedAds.sort((a: any, b: any) => {
        const aVal = Number(a.customValues?.[specName] ?? 0);
        const bVal = Number(b.customValues?.[specName] ?? 0);
        return dir === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    const finalTotal = hasNumericFilters ? formattedAds.length : total;
    return res.json({
      ads: formattedAds,
      pagination: { page, limit, total: finalTotal, totalPages: Math.ceil(finalTotal / limit) },
    });
  } catch (error) {
    console.error("GET /api/ads error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /:id - Single ad detail
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const ad = await prisma.ad.findUnique({ where: { id }, select: AD_FULL_SELECT });
    if (!ad) return res.status(404).json({ error: "Ad not found" });

    prisma.ad.update({ where: { id }, data: { views: { increment: 1 } } }).catch(console.error);

    return res.json({ ad: formatAd(ad) });
  } catch (error) {
    console.error("GET /api/ads/:id error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST / - Create ad
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = adSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const { title, description, price, currency, location, city, state, country, latitude, longitude, categoryId } = parsed.data;
    const images = (req.body.images as string[]) || [];
    const customValues = req.body.customValues ? JSON.stringify(req.body.customValues) : null;
    const status = req.body.status || "PENDING";

    const ad = await prisma.ad.create({
      data: {
        title, description, price, currency, location, city,
        state: state || null,
        country: country || "Türkiye",
        latitude: latitude || null,
        longitude: longitude || null,
        categoryId,
        userId: req.user!.id,
        status,
        customValues,
        images: { create: images.map((url: string, index: number) => ({ url, order: index })) },
      },
      select: AD_SELECT,
    });

    indexAd(ad.id).catch(console.error);

    return res.status(201).json({ ad: formatAd(ad) });
  } catch (error) {
    console.error("POST /api/ads error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /:id - Update ad
router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id as string;
    const ad = await prisma.ad.findUnique({ where: { id } });
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    if (ad.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const parsed = adSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const customValues = req.body.customValues ? JSON.stringify(req.body.customValues) : undefined;

    if (req.body.images) {
      await prisma.image.deleteMany({ where: { adId: id } });
      await prisma.image.createMany({
        data: (req.body.images as string[]).map((url, index) => ({ url, order: index, adId: id })),
      });
    }

    const updated = await prisma.ad.update({
      where: { id },
      data: {
        ...parsed.data,
        status: req.body.status || "PENDING",
        ...(customValues !== undefined ? { customValues } : {}),
      },
      select: AD_FULL_SELECT,
    });

    indexAd(id).catch(console.error);

    return res.json({ ad: formatAd(updated) });
  } catch (error) {
    console.error("PUT /api/ads/:id error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /:id - Delete ad
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id as string;
    const ad = await prisma.ad.findUnique({ where: { id } });
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    if (ad.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.favorite.deleteMany({ where: { adId: id } });
    await prisma.image.deleteMany({ where: { adId: id } });
    await prisma.ad.delete({ where: { id } });

    deleteAdFromIndex(id).catch(console.error);

    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/ads/:id error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /:id/favorite - Toggle favorite
router.post("/:id/favorite", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.favorite.findUnique({
      where: { userId_adId: { userId: req.user!.id, adId: id } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { userId_adId: { userId: req.user!.id, adId: id } } });
      return res.json({ favorited: false });
    } else {
      await prisma.favorite.create({ data: { userId: req.user!.id, adId: id } });
      return res.json({ favorited: true });
    }
  } catch (error) {
    console.error("Favorite toggle error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
