import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

// POST /api/upload - Handle image upload and compress with sharp to WebP format
router.post("/", requireAuth, upload.single("file"), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `img-${uniqueSuffix}.webp`;
    const outputPath = path.join(uploadDir, filename);

    // Apply high-performance compression and conversion using Sharp
    await sharp(req.file.buffer)
      .resize({
        width: 1200,
        height: 900,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // BACKEND_URL = public domain (e.g. https://yourdomain.com)
    // BACKEND_API_URL = internal docker URL (http://backend:5000) — NOT suitable for image URLs
    const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fileUrl = `${BACKEND_URL}/uploads/${filename}`;

    return res.status(200).json({
      url: fileUrl,
      filename,
    });
  } catch (error: any) {
    console.error("Image upload/compression error:", error);
    return res.status(500).json({ error: error.message || "Failed to process image" });
  }
});

export default router;
