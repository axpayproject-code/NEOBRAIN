import { Router } from "express";
import { db, screeningResponsesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/screening-responses", async (req, res) => {
  const screeningId = req.query.screeningId ? Number(req.query.screeningId) : undefined;
  const childId = req.query.childId ? Number(req.query.childId) : undefined;

  const conditions = [];
  if (screeningId) conditions.push(eq(screeningResponsesTable.screeningId, screeningId));
  if (childId) conditions.push(eq(screeningResponsesTable.childId, childId));

  const rows = conditions.length > 0
    ? await db.select().from(screeningResponsesTable).where(and(...conditions))
    : await db.select().from(screeningResponsesTable);

  return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/screening-responses", async (req, res) => {
  const body = req.body;
  const isBulk = Array.isArray(body);
  const items = isBulk ? body : [body];

  for (const item of items) {
    if (!item.screeningId || !item.childId || !item.questionCode || !item.domain || !item.questionText || !item.responseValue) {
      return res.status(400).json({ error: "screeningId, childId, questionCode, domain, questionText, and responseValue are required for each response" });
    }
  }

  const inserted = await db.insert(screeningResponsesTable).values(
    items.map((item: {
      screeningId: number; childId: number; questionCode: string; domain: string;
      questionText: string; responseValue: string; responseLabel?: string;
      scoreContribution?: number; flagged?: string; respondentType?: string;
    }) => ({
      screeningId: item.screeningId,
      childId: item.childId,
      questionCode: item.questionCode,
      domain: item.domain,
      questionText: item.questionText,
      responseValue: item.responseValue,
      responseLabel: item.responseLabel,
      scoreContribution: item.scoreContribution,
      flagged: item.flagged,
      respondentType: item.respondentType ?? "parent",
    }))
  ).returning();

  return res.status(201).json(inserted.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

export default router;
