import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

const CONVERSATION_SELECT = {
  id: true,
  adId: true,
  updatedAt: true,
  ad: {
    select: {
      id: true,
      title: true,
      images: { select: { url: true }, orderBy: { order: "asc" as const }, take: 1 },
    },
  },
  participants: {
    select: {
      userId: true,
      lastReadAt: true,
      user: { select: { id: true, name: true, avatar: true } },
    },
  },
  messages: {
    select: { id: true, content: true, senderId: true, createdAt: true },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
};

// GET /api/messages — list conversations for current user
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    const conversationIds = participations.map((p) => p.conversationId);

    const conversations = await prisma.conversation.findMany({
      where: { id: { in: conversationIds } },
      select: CONVERSATION_SELECT,
      orderBy: { updatedAt: "desc" },
    });

    // Attach unread count per conversation
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const myParticipant = conv.participants.find((p) => p.userId === userId);
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            ...(myParticipant?.lastReadAt
              ? { createdAt: { gt: myParticipant.lastReadAt } }
              : {}),
          },
        });
        const otherParticipant = conv.participants.find((p) => p.userId !== userId);
        return { ...conv, unreadCount, otherUser: otherParticipant?.user ?? null };
      })
    );

    return res.json({ conversations: result });
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/messages/:conversationId — get messages in a conversation
router.get("/:conversationId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.params as { conversationId: string };

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [conversation, messages] = await Promise.all([
      prisma.conversation.findUnique({
        where: { id: conversationId },
        select: {
          id: true,
          adId: true,
          ad: {
            select: {
              id: true,
              title: true,
              price: true,
              currency: true,
              images: { select: { url: true }, orderBy: { order: "asc" as const }, take: 1 },
            },
          },
          participants: {
            select: {
              userId: true,
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      }),
      prisma.message.findMany({
        where: { conversationId },
        select: {
          id: true,
          content: true,
          senderId: true,
          createdAt: true,
          sender: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!conversation) {
      return res.status(404).json({ error: "Not found" });
    }

    // Mark all messages from others as read
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    return res.json({ conversation, messages });
  } catch (error) {
    console.error("GET /api/messages/:conversationId error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/messages — start or get existing conversation with a seller about an ad
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { adId, sellerId, initialMessage } = req.body as {
      adId?: string;
      sellerId: string;
      initialMessage?: string;
    };

    if (!sellerId) {
      return res.status(400).json({ error: "sellerId is required" });
    }
    if (sellerId === userId) {
      return res.status(400).json({ error: "Cannot message yourself" });
    }

    // Find existing conversation between these two users about this ad
    let conversation = null;
    if (adId) {
      const existing = await prisma.conversation.findFirst({
        where: {
          adId,
          participants: {
            every: {
              userId: { in: [userId, sellerId] },
            },
          },
        },
        include: {
          participants: { select: { userId: true } },
        },
      });
      // Verify both participants exist
      if (
        existing &&
        existing.participants.some((p) => p.userId === userId) &&
        existing.participants.some((p) => p.userId === sellerId)
      ) {
        conversation = existing;
      }
    } else {
      // Direct conversation without ad
      const existing = await prisma.conversation.findFirst({
        where: {
          adId: null,
          participants: {
            every: { userId: { in: [userId, sellerId] } },
          },
        },
        include: { participants: { select: { userId: true } } },
      });
      if (
        existing &&
        existing.participants.some((p) => p.userId === userId) &&
        existing.participants.some((p) => p.userId === sellerId)
      ) {
        conversation = existing;
      }
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          ...(adId ? { adId } : {}),
          participants: {
            create: [{ userId }, { userId: sellerId }],
          },
        },
        include: { participants: { select: { userId: true } } },
      });
    }

    // Send initial message if provided
    if (initialMessage?.trim()) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          content: initialMessage.trim(),
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    }

    return res.status(201).json({ conversationId: conversation.id });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/messages/unread/count — total unread messages count
router.get("/unread/count", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });

    let total = 0;
    await Promise.all(
      participations.map(async (p) => {
        const count = await prisma.message.count({
          where: {
            conversationId: p.conversationId,
            senderId: { not: userId },
            ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
          },
        });
        total += count;
      })
    );

    return res.json({ count: total });
  } catch (error) {
    console.error("GET /api/messages/unread/count error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
