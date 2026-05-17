import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { registerSchema, loginSchema } from "../lib/validations.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const COOKIE_NAME = "auth_token";

// Cookie helper
const setAuthCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// POST /register
router.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        phone: body.phone || null,
        role: "USER",
        status: "ACTIVE",
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    if (err.errors) {
      return res.status(400).json({ error: err.errors[0]?.message || "Validation failed" });
    }
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.password || user.status === "BANNED") {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    setAuthCookie(res, token);

    return res.json({
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    if (err.errors) {
      return res.status(400).json({ error: err.errors[0]?.message || "Validation failed" });
    }
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /logout
router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME);
  return res.json({ message: "Logged out successfully" });
});

// GET /me
router.get("/me", (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({ user: req.user });
});

export default router;
