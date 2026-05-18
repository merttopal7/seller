import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/auth.js";
import { reindexAll, indexAd, deleteAdFromIndex } from "../lib/search-service.js";

const router = Router();

// Apply requireAdmin to all admin sub-routes
router.use(requireAdmin);

// GET /stats - Dashboard stats overview
router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, totalAds, activeAds, pendingAds, totalViews] = await Promise.all([
      prisma.user.count(),
      prisma.ad.count(),
      prisma.ad.count({ where: { status: "ACTIVE" } }),
      prisma.ad.count({ where: { status: "PENDING" } }),
      prisma.ad.aggregate({ _sum: { views: true } }),
    ]);

    const recentAds = await prisma.ad.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true, role: true },
    });

    return res.json({
      stats: {
        totalUsers,
        totalAds,
        activeAds,
        pendingAds,
        totalViews: totalViews._sum.views ?? 0,
      },
      recentAds,
      recentUsers,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /ads - List ads for moderation
router.get("/ads", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const status = (req.query.status as string) || "";
    const search = ((req.query.search as string) || "").trim();
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) where.title = { contains: search };

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          status: true,
          views: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          category: { select: { name: true } },
        },
      }),
      prisma.ad.count({ where }),
    ]);

    return res.json({
      ads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin list ads error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /ads/:id - Approve or Reject ad
router.patch("/ads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "REJECTED", "PENDING", "EXPIRED", "SOLD"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ad = await prisma.ad.update({
      where: { id },
      data: { status },
    });

    // Re-index in Elasticsearch to reflect the approved/rejected status
    indexAd(id).catch(console.error);

    return res.json({ ad });
  } catch (error) {
    console.error("Admin edit ad error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /ads/:id - Admin delete ad
router.delete("/ads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Delete relation records manually
    await prisma.favorite.deleteMany({ where: { adId: id } });
    await prisma.image.deleteMany({ where: { adId: id } });
    await prisma.ad.delete({ where: { id } });

    // Delete from Elasticsearch index
    deleteAdFromIndex(id).catch(console.error);

    return res.json({ success: true });
  } catch (error) {
    console.error("Admin delete ad error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /users - List users
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { ads: true } },
        },
      }),
      prisma.user.count(),
    ]);

    return res.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin list users error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /users/:id - Ban or Unban user
router.patch("/users/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!["ACTIVE", "BANNED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, status: true },
    });

    return res.json({ user });
  } catch (error) {
    console.error("Admin update user error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /categories - List categories for administration
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: { select: { id: true, name: true } },
        customFilters: true,
        _count: { select: { ads: true } },
      },
      orderBy: { order: "asc" },
    });
    return res.json({ categories });
  } catch (error) {
    console.error("Admin list categories error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /categories/:id - Get a single category
router.get("/categories/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        customFilters: true,
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.json({ category });
  } catch (error) {
    console.error("Admin get single category error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /categories - Create new category
router.post("/categories", async (req, res) => {
  try {
    const { name, slug, icon, image, description, order, parentId, customFilterIds } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "Name and Slug are required" });
    }

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: "Category slug already exists" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        icon: icon || null,
        image: image || null,
        description: description || null,
        order: Number(order) || 0,
        parentId: parentId || null,
        customFilters: customFilterIds ? {
          connect: customFilterIds.map((fid: string) => ({ id: fid }))
        } : undefined,
      },
      include: {
        customFilters: true,
      },
    });

    return res.status(201).json({ category });
  } catch (error) {
    console.error("Admin create category error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /categories/:id - Update category
router.patch("/categories/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, slug, icon, image, description, order, parentId, customFilterIds } = req.body;

    const existingCat = await prisma.category.findUnique({ where: { id } });
    if (!existingCat) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (slug && slug !== existingCat.slug) {
      const slugCheck = await prisma.category.findUnique({ where: { slug } });
      if (slugCheck) {
        return res.status(400).json({ error: "Slug already exists" });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingCat.name,
        slug: slug !== undefined ? slug : existingCat.slug,
        icon: icon !== undefined ? icon : existingCat.icon,
        image: image !== undefined ? image : existingCat.image,
        description: description !== undefined ? description : existingCat.description,
        order: order !== undefined ? Number(order) : existingCat.order,
        parentId: parentId !== undefined ? (parentId || null) : existingCat.parentId,
        customFilters: customFilterIds !== undefined ? {
          set: customFilterIds.map((fid: string) => ({ id: fid }))
        } : undefined,
      },
      include: {
        customFilters: true,
      },
    });

    return res.json({ category });
  } catch (error) {
    console.error("Admin update category error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /categories/:id - Delete category
router.delete("/categories/:id", async (req, res) => {
  try {
    const id = req.params.id as string;

    const existingCat = await prisma.category.findUnique({ where: { id } });
    if (!existingCat) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Set children parentId to null or delete them. Let's set parentId to null to preserve them!
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });

    // Delete ads in category
    await prisma.ad.deleteMany({ where: { categoryId: id } });

    await prisma.category.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error("Admin delete category error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /filters - List all reusable custom filters
router.get("/filters", async (req, res) => {
  try {
    const filters = await prisma.customFilter.findMany({
      orderBy: { name: "asc" },
    });
    return res.json({ filters });
  } catch (error) {
    console.error("Admin list reusable filters error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /filters - Create new reusable custom filter
router.post("/filters", async (req, res) => {
  try {
    const { name, type, options } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Name and Type are required" });
    }

    // Check if filter name is unique
    const existing = await prisma.customFilter.findUnique({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: "A filter with this name already exists" });
    }

    const filter = await prisma.customFilter.create({
      data: {
        name,
        type,
        options: options || null,
      },
    });

    return res.status(201).json({ filter });
  } catch (error) {
    console.error("Admin create reusable filter error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /filters/:id - Update reusable custom filter
router.patch("/filters/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, type, options } = req.body;

    const existing = await prisma.customFilter.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Reusable filter not found" });
    }

    if (name && name !== existing.name) {
      const nameCheck = await prisma.customFilter.findUnique({ where: { name } });
      if (nameCheck) {
        return res.status(400).json({ error: "A filter with this name already exists" });
      }
    }

    const filter = await prisma.customFilter.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        type: type !== undefined ? type : existing.type,
        options: options !== undefined ? options : existing.options,
      },
    });

    return res.json({ filter });
  } catch (error) {
    console.error("Admin update reusable filter error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /filters/:id - Delete reusable custom filter
router.delete("/filters/:id", async (req, res) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.customFilter.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Reusable filter not found" });
    }

    await prisma.customFilter.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error("Admin delete reusable filter error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /reindex - Rebuild Elasticsearch index from Prisma data
router.post("/reindex", async (_req, res) => {
  try {
    const count = await reindexAll();
    return res.json({ success: true, indexed: count });
  } catch (error) {
    console.error("Reindex error:", error);
    return res.status(500).json({ error: "Reindex failed" });
  }
});

export default router;
