import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import {
  specialistThreads,
  specialistMessages,
  type InsertSpecialistThread,
  type InsertSpecialistMessage,
} from "@workspace/db";
import { eq, or, and, desc, sql } from "drizzle-orm";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

// GET /messaging/threads — list threads for current user
router.get("/messaging/threads", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const threads = await db
    .select()
    .from(specialistThreads)
    .where(or(eq(specialistThreads.parentUserId, userId), eq(specialistThreads.specialistUserId, userId)))
    .orderBy(desc(specialistThreads.lastMessageAt));

  // Count unread messages per thread for this user
  const result = await Promise.all(
    threads.map(async (t) => {
      const unreadRows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(specialistMessages)
        .where(
          and(
            eq(specialistMessages.threadId, t.id),
            sql`${specialistMessages.readAt} IS NULL`,
            sql`${specialistMessages.senderUserId} != ${userId}`
          )
        );
      return {
        ...t,
        lastMessageAt: t.lastMessageAt.toISOString(),
        createdAt: t.createdAt.toISOString(),
        unreadCount: unreadRows[0]?.count ?? 0,
      };
    })
  );

  return res.json(result);
});

// POST /messaging/threads — create a new thread
router.post("/messaging/threads", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const body = req.body as Partial<InsertSpecialistThread & { initialMessage?: string }>;

  if (!body.specialistUserId || !body.subject || !body.specialistType) {
    return res.status(400).json({ error: "specialistUserId, subject, and specialistType are required" });
  }

  const [thread] = await db
    .insert(specialistThreads)
    .values({
      childId: body.childId ?? null,
      parentUserId: userId,
      specialistUserId: body.specialistUserId,
      specialistType: body.specialistType,
      subject: body.subject,
      status: "active",
    })
    .returning();

  if (!thread) return res.status(500).json({ error: "Failed to create thread" });

  // If initial message provided, insert it
  if (body.initialMessage?.trim()) {
    const [me] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
    await db.insert(specialistMessages).values({
      threadId: thread.id,
      senderUserId: userId,
      senderRole: me?.role ?? "parent",
      content: body.initialMessage.trim(),
    });
  }

  return res.status(201).json({
    ...thread,
    lastMessageAt: thread.lastMessageAt.toISOString(),
    createdAt: thread.createdAt.toISOString(),
  });
});

// GET /messaging/threads/:id/messages — get messages in thread
router.get("/messaging/threads/:id/messages", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const threadId = parseInt(req.params.id, 10);
  if (isNaN(threadId)) return res.status(400).json({ error: "Invalid thread id" });

  // Verify access
  const [thread] = await db.select().from(specialistThreads).where(eq(specialistThreads.id, threadId));
  if (!thread) return res.status(404).json({ error: "Thread not found" });
  if (thread.parentUserId !== userId && thread.specialistUserId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const msgs = await db
    .select()
    .from(specialistMessages)
    .where(eq(specialistMessages.threadId, threadId))
    .orderBy(specialistMessages.createdAt);

  // Mark unread messages from other party as read
  await db
    .update(specialistMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(specialistMessages.threadId, threadId),
        sql`${specialistMessages.senderUserId} != ${userId}`,
        sql`${specialistMessages.readAt} IS NULL`
      )
    );

  return res.json(
    msgs.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    }))
  );
});

// POST /messaging/threads/:id/messages — send a message
router.post("/messaging/threads/:id/messages", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const threadId = parseInt(req.params.id, 10);
  if (isNaN(threadId)) return res.status(400).json({ error: "Invalid thread id" });

  const [thread] = await db.select().from(specialistThreads).where(eq(specialistThreads.id, threadId));
  if (!thread) return res.status(404).json({ error: "Thread not found" });
  if (thread.parentUserId !== userId && thread.specialistUserId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { content } = req.body as { content?: string };
  if (!content?.trim()) return res.status(400).json({ error: "content is required" });

  const [me] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));

  const [msg] = await db
    .insert(specialistMessages)
    .values({
      threadId,
      senderUserId: userId,
      senderRole: me?.role ?? "parent",
      content: content.trim(),
    })
    .returning();

  if (!msg) return res.status(500).json({ error: "Failed to send message" });

  // Update thread lastMessageAt
  await db
    .update(specialistThreads)
    .set({ lastMessageAt: new Date() })
    .where(eq(specialistThreads.id, threadId));

  return res.status(201).json({
    ...msg,
    createdAt: msg.createdAt.toISOString(),
    readAt: msg.readAt?.toISOString() ?? null,
  });
});

// GET /messaging/threads/:id — single thread details
router.get("/messaging/threads/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const threadId = parseInt(req.params.id, 10);
  if (isNaN(threadId)) return res.status(400).json({ error: "Invalid thread id" });

  const [thread] = await db.select().from(specialistThreads).where(eq(specialistThreads.id, threadId));
  if (!thread) return res.status(404).json({ error: "Thread not found" });
  if (thread.parentUserId !== userId && thread.specialistUserId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return res.json({
    ...thread,
    lastMessageAt: thread.lastMessageAt.toISOString(),
    createdAt: thread.createdAt.toISOString(),
  });
});

// PATCH /messaging/threads/:id — update thread status
router.patch("/messaging/threads/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const threadId = parseInt(req.params.id, 10);
  if (isNaN(threadId)) return res.status(400).json({ error: "Invalid thread id" });

  const [thread] = await db.select().from(specialistThreads).where(eq(specialistThreads.id, threadId));
  if (!thread) return res.status(404).json({ error: "Thread not found" });
  if (thread.parentUserId !== userId && thread.specialistUserId !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { status } = req.body as { status?: string };
  if (status && !["active", "closed", "archived"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const [updated] = await db
    .update(specialistThreads)
    .set({ ...(status ? { status } : {}) })
    .where(eq(specialistThreads.id, threadId))
    .returning();

  return res.json({
    ...updated,
    lastMessageAt: updated!.lastMessageAt.toISOString(),
    createdAt: updated!.createdAt.toISOString(),
  });
});

export default router;
