import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/notifications", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const limit = parseInt(req.query.limit as string) || 50;
  const unreadOnly = req.query.unread === "true";
  const where = unreadOnly
    ? and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false))
    : eq(notificationsTable.userId, userId);
  const rows = await db.select().from(notificationsTable).where(where).orderBy(desc(notificationsTable.createdAt)).limit(limit);
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(notificationsTable)
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
  return res.json({ notifications: rows, unreadCount: count });
});

router.patch("/notifications/:id/read", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const [row] = await db.update(notificationsTable)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)))
    .returning();
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(row);
});

router.patch("/notifications/read-all", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  await db.update(notificationsTable)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
  return res.json({ ok: true });
});

router.post("/notifications", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { targetUserId, type, title, message, icon, actionUrl, actionLabel, metadata, priority } = req.body as Record<string, unknown>;
  const recipientId = typeof targetUserId === "string" ? targetUserId : userId;
  const [row] = await db.insert(notificationsTable).values({
    userId: recipientId,
    type: typeof type === "string" ? type : "general",
    title: typeof title === "string" ? title : "Notification",
    message: typeof message === "string" ? message : "",
    icon: typeof icon === "string" ? icon : null,
    actionUrl: typeof actionUrl === "string" ? actionUrl : null,
    actionLabel: typeof actionLabel === "string" ? actionLabel : null,
    metadata: metadata ?? null,
    priority: typeof priority === "string" ? priority : "normal",
  }).returning();
  return res.status(201).json(row);
});

router.delete("/notifications/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  await db.delete(notificationsTable).where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
  return res.json({ ok: true });
});

export default router;
