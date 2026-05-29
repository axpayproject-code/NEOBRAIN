import { Router } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

router.get("/audit-logs", async (req, res) => {
  const userId = req.query.userId as string | undefined;
  const resourceType = req.query.resourceType as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 100), 500);

  const conditions = [];
  if (userId) conditions.push(eq(auditLogsTable.userId, userId));
  if (resourceType) conditions.push(eq(auditLogsTable.resourceType, resourceType));

  const rows = conditions.length > 0
    ? await db.select().from(auditLogsTable).where(and(...conditions)).orderBy(desc(auditLogsTable.occurredAt)).limit(limit)
    : await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.occurredAt)).limit(limit);

  return res.json(rows.map(r => ({ ...r, occurredAt: r.occurredAt.toISOString() })));
});

router.post("/audit-logs", async (req, res) => {
  const { userId, userEmail, userRole, action, resourceType, resourceId,
    oldValues, newValues, ipAddress, userAgent, requestId, outcome, notes } = req.body;

  if (!action || !resourceType) {
    return res.status(400).json({ error: "action and resourceType are required" });
  }

  const [row] = await db.insert(auditLogsTable).values({
    userId, userEmail, userRole, action, resourceType, resourceId,
    oldValues, newValues, ipAddress, userAgent, requestId,
    outcome: outcome ?? "success", notes,
  }).returning();

  return res.status(201).json({ ...row, occurredAt: row.occurredAt.toISOString() });
});

export default router;
