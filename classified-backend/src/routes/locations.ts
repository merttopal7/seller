import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/locations - Fetch all countries, cities, and neighborhoods
router.get("/", async (req, res) => {
  try {
    const countries = await prisma.country.findMany({
      include: {
        states: {
          include: {
            cities: {
              include: {
                neighborhoods: {
                  orderBy: { name: "asc" },
                },
              },
              orderBy: { name: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    return res.json({ countries });
  } catch (error) {
    console.error("Fetch locations error:", error);
    return res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// POST /api/locations/countries - Create a new country (Admin Only)
router.post("/countries", requireAdmin as any, async (req: any, res) => {
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Country name is required" });
  }

  try {
    const existing = await prisma.country.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return res.status(400).json({ error: "Country already exists" });
    }

    const country = await prisma.country.create({
      data: { name: name.trim() },
    });

    return res.status(201).json({ country });
  } catch (error) {
    console.error("Create country error:", error);
    return res.status(500).json({ error: "Failed to create country" });
  }
});

// PUT /api/locations/countries/:countryId - Update a country (Admin Only)
router.put("/countries/:countryId", requireAdmin as any, async (req: any, res) => {
  const { countryId } = req.params;
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Country name is required" });
  }

  try {
    const updated = await prisma.country.update({
      where: { id: countryId },
      data: { name: name.trim() },
    });
    return res.json({ country: updated });
  } catch (error) {
    console.error("Update country error:", error);
    return res.status(500).json({ error: "Failed to update country" });
  }
});

// DELETE /api/locations/countries/:countryId - Delete a country (Admin Only)
router.delete("/countries/:countryId", requireAdmin as any, async (req: any, res) => {
  const { countryId } = req.params;

  try {
    await prisma.country.delete({
      where: { id: countryId },
    });
    return res.json({ success: true, message: "Country deleted successfully" });
  } catch (error) {
    console.error("Delete country error:", error);
    return res.status(500).json({ error: "Failed to delete country" });
  }
});

// ================== STATES ==================

// POST /api/locations/states - Create a new state linked to a country (Admin Only)
router.post("/states", requireAdmin as any, async (req: any, res) => {
  const { name, countryId } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "State name is required" });
  }
  if (!countryId) {
    return res.status(400).json({ error: "Country ID is required" });
  }

  try {
    const existing = await prisma.state.findFirst({
      where: { name: name.trim(), countryId },
    });
    if (existing) {
      return res.status(400).json({ error: "State already exists in this country" });
    }

    const state = await prisma.state.create({
      data: { name: name.trim(), countryId },
    });

    return res.status(201).json({ state });
  } catch (error) {
    console.error("Create state error:", error);
    return res.status(500).json({ error: "Failed to create state" });
  }
});

// PUT /api/locations/states/:stateId - Update a state (Admin Only)
router.put("/states/:stateId", requireAdmin as any, async (req: any, res) => {
  const { stateId } = req.params;
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "State name is required" });
  }

  try {
    const updated = await prisma.state.update({
      where: { id: stateId },
      data: { name: name.trim() },
    });
    return res.json({ state: updated });
  } catch (error) {
    console.error("Update state error:", error);
    return res.status(500).json({ error: "Failed to update state" });
  }
});

// DELETE /api/locations/states/:stateId - Delete a state (Admin Only)
router.delete("/states/:stateId", requireAdmin as any, async (req: any, res) => {
  const { stateId } = req.params;

  try {
    await prisma.state.delete({
      where: { id: stateId },
    });
    return res.json({ success: true, message: "State deleted successfully" });
  } catch (error) {
    console.error("Delete state error:", error);
    return res.status(500).json({ error: "Failed to delete state" });
  }
});

// ================== CITIES ==================

// POST /api/locations/cities - Create a new city linked to a state (Admin Only)
router.post("/cities", requireAdmin as any, async (req: any, res) => {
  const { name, stateId } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "City name is required" });
  }
  if (!stateId) {
    return res.status(400).json({ error: "State ID is required" });
  }

  try {
    const state = await prisma.state.findUnique({
      where: { id: stateId },
    });
    if (!state) {
      return res.status(404).json({ error: "State not found" });
    }

    const existing = await prisma.city.findFirst({
      where: { name: name.trim(), stateId },
    });
    if (existing) {
      return res.status(400).json({ error: "City already exists in this state" });
    }

    const city = await prisma.city.create({
      data: {
        name: name.trim(),
        stateId,
      },
    });

    return res.status(201).json({ city });
  } catch (error) {
    console.error("Create city error:", error);
    return res.status(500).json({ error: "Failed to create city" });
  }
});

// PUT /api/locations/cities/:cityId - Update a city (Admin Only)
router.put("/cities/:cityId", requireAdmin as any, async (req: any, res) => {
  const { cityId } = req.params;
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "City name is required" });
  }

  try {
    const updated = await prisma.city.update({
      where: { id: cityId },
      data: { name: name.trim() },
    });
    return res.json({ city: updated });
  } catch (error) {
    console.error("Update city error:", error);
    return res.status(500).json({ error: "Failed to update city" });
  }
});

// DELETE /api/locations/cities/:cityId - Delete a city (Admin Only)
router.delete("/cities/:cityId", requireAdmin as any, async (req: any, res) => {
  const { cityId } = req.params;

  try {
    await prisma.city.delete({
      where: { id: cityId },
    });
    return res.json({ success: true, message: "City deleted successfully" });
  } catch (error) {
    console.error("Delete city error:", error);
    return res.status(500).json({ error: "Failed to delete city" });
  }
});

// POST /api/locations/neighborhoods - Create a neighborhood (Admin Only)
router.post("/neighborhoods", requireAdmin as any, async (req: any, res) => {
  const { name, cityId, latitude, longitude } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Neighborhood name is required" });
  }
  if (!cityId) {
    return res.status(400).json({ error: "City ID is required" });
  }

  try {
    const city = await prisma.city.findUnique({
      where: { id: cityId },
    });
    if (!city) {
      return res.status(404).json({ error: "City not found" });
    }

    const existing = await prisma.neighborhood.findFirst({
      where: { name: name.trim(), cityId },
    });
    if (existing) {
      return res.status(400).json({ error: "Neighborhood already exists in this city" });
    }

    const neighborhood = await prisma.neighborhood.create({
      data: {
        name: name.trim(),
        cityId,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });

    return res.status(201).json({ neighborhood });
  } catch (error) {
    console.error("Create neighborhood error:", error);
    return res.status(500).json({ error: "Failed to create neighborhood" });
  }
});

// PUT /api/locations/neighborhoods/:neighborhoodId - Update a neighborhood (Admin Only)
router.put("/neighborhoods/:neighborhoodId", requireAdmin as any, async (req: any, res) => {
  const { neighborhoodId } = req.params;
  const { name, latitude, longitude } = req.body;
  
  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Neighborhood name is required" });
  }

  try {
    const updated = await prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: { 
        name: name.trim(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });
    return res.json({ neighborhood: updated });
  } catch (error) {
    console.error("Update neighborhood error:", error);
    return res.status(500).json({ error: "Failed to update neighborhood" });
  }
});

// DELETE /api/locations/neighborhoods/:neighborhoodId - Delete a neighborhood (Admin Only)
router.delete("/neighborhoods/:neighborhoodId", requireAdmin as any, async (req: any, res) => {
  const { neighborhoodId } = req.params;

  try {
    await prisma.neighborhood.delete({
      where: { id: neighborhoodId },
    });
    return res.json({ success: true, message: "Neighborhood deleted successfully" });
  } catch (error) {
    console.error("Delete neighborhood error:", error);
    return res.status(500).json({ error: "Failed to delete neighborhood" });
  }
});

export default router;
