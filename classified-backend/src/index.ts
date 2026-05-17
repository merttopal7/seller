import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import adsRoutes from "./routes/ads.js";
import categoriesRoutes from "./routes/categories.js";
import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";
import locationsRoutes from "./routes/locations.js";
import messagesRoutes from "./routes/messages.js";
import { authenticateToken } from "./middleware/auth.js";
import { prisma } from "./lib/prisma.js";
import type { JWTPayload } from "./middleware/auth.js";
import { ensureAdsIndex, esClient, ADS_INDEX } from "./lib/elasticsearch.js";
import { reindexAll } from "./lib/search-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  },
});

// CORS configuration - allow request from Next.js server/client
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Global Auth Middleware
app.use(authenticateToken as any);

// Routes Registration
app.use("/api/auth", authRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/messages", messagesRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, avatar: true, status: true },
    });
    if (!user || user.status === "BANNED") return next(new Error("Unauthorized"));
    (socket as any).user = user;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const user = (socket as any).user as { id: string; name: string; avatar: string | null };

  socket.join(`user:${user.id}`);

  socket.on("join_conversation", async (conversationId: string) => {
    try {
      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId: user.id } },
      });
      if (participant) socket.join(`conversation:${conversationId}`);
    } catch (err) {
      console.error("join_conversation error:", err);
    }
  });

  socket.on("leave_conversation", (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on(
    "send_message",
    async (
      data: { conversationId: string; content: string },
      callback?: (result: { error?: string; message?: object }) => void
    ) => {
      try {
        const { conversationId, content } = data;
        if (!content?.trim()) { callback?.({ error: "Empty message" }); return; }

        const participant = await prisma.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId, userId: user.id } },
        });
        if (!participant) { callback?.({ error: "Not a participant" }); return; }

        const message = await prisma.message.create({
          data: { conversationId, senderId: user.id, content: content.trim() },
          select: {
            id: true, content: true, senderId: true, createdAt: true,
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        io.to(`conversation:${conversationId}`).emit("new_message", message);

        const others = await prisma.conversationParticipant.findMany({
          where: { conversationId, userId: { not: user.id } },
          select: { userId: true },
        });
        others.forEach((p) => {
          io.to(`user:${p.userId}`).emit("conversation_updated", { conversationId });
        });

        callback?.({ message });
      } catch (err) {
        console.error("send_message error:", err);
        callback?.({ error: "Failed to send" });
      }
    }
  );

  socket.on("mark_read", async (conversationId: string) => {
    try {
      await prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: user.id } },
        data: { lastReadAt: new Date() },
      });
      socket.to(`conversation:${conversationId}`).emit("messages_read", {
        conversationId,
        userId: user.id,
      });
    } catch (err) {
      console.error("mark_read error:", err);
    }
  });

  socket.on("typing_start", (conversationId: string) => {
    socket.to(`conversation:${conversationId}`).emit("user_typing", { userId: user.id, name: user.name });
  });

  socket.on("typing_stop", (conversationId: string) => {
    socket.to(`conversation:${conversationId}`).emit("user_stopped_typing", { userId: user.id });
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
httpServer.listen(PORT, async () => {
  console.log(`🚀 Classified Ads Backend is running at http://localhost:${PORT}`);
  try {
    await ensureAdsIndex();
    const { count } = await esClient.count({ index: ADS_INDEX });
    if (count === 0) {
      console.log("📦 ES index empty — reindexing all ads...");
      const indexed = await reindexAll();
      console.log(`✅ Reindexed ${indexed} ads`);
    } else {
      console.log(`✅ Elasticsearch ready (${count} ads indexed)`);
    }
  } catch (err) {
    console.warn("⚠️  Elasticsearch not available — search will be degraded:", (err as Error).message);
  }
});
