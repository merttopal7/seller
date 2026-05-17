import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        customFilters: true,
        _count: {
          select: {
            ads: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      image: cat.image,
      description: cat.description,
      order: cat.order,
      parentId: cat.parentId,
      customFilters: cat.customFilters.map((f) => ({
        name: f.name,
        type: f.type,
        options: f.options ? f.options.split(",").map((o) => o.trim()) : [],
      })),
      count: cat._count.ads,
    }));

    return res.json({ categories: formatted });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;
