import { Router } from "express";
import { db, riskHistoryTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/risk-history", async (req, res) => {
  const childId = req.query.childId ? Number(req.query.childId) : undefined;

  const rows = childId
    ? await db.select().from(riskHistoryTable).where(eq(riskHistoryTable.childId, childId)).orderBy(desc(riskHistoryTable.recordedAt))
    : await db.select().from(riskHistoryTable).orderBy(desc(riskHistoryTable.recordedAt)).limit(200);

  return res.json(rows.map(r => ({ ...r, recordedAt: r.recordedAt.toISOString() })));
});

router.get("/risk-history/:childId", async (req, res) => {
  const childId = Number(req.params.childId);
  if (isNaN(childId)) return res.status(400).json({ error: "Invalid childId" });

  const rows = await db.select().from(riskHistoryTable)
    .where(eq(riskHistoryTable.childId, childId))
    .orderBy(desc(riskHistoryTable.recordedAt));

  return res.json(rows.map(r => ({ ...r, recordedAt: r.recordedAt.toISOString() })));
});

export default router;
