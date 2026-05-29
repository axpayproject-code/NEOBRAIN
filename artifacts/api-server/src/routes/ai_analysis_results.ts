import { Router } from "express";
import { db, aiAnalysisResultsTable, childrenTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

router.get("/ai-analysis", async (req, res) => {
  const childId = req.query.childId ? Number(req.query.childId) : undefined;
  const conditions = [];
  if (childId) conditions.push(eq(aiAnalysisResultsTable.childId, childId));

  const rows = conditions.length > 0
    ? await db.select().from(aiAnalysisResultsTable).where(and(...conditions)).orderBy(desc(aiAnalysisResultsTable.createdAt))
    : await db.select().from(aiAnalysisResultsTable).orderBy(desc(aiAnalysisResultsTable.createdAt));

  return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/ai-analysis/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [row] = await db.select().from(aiAnalysisResultsTable).where(eq(aiAnalysisResultsTable.id, id));
  if (!row) return res.status(404).json({ error: "Not found" });

  return res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.post("/ai-analysis", async (req, res) => {
  const { childId, screeningId, analysisType, modelUsed, inputSummary, rawOutput,
    structuredInsights, confidenceScore, flaggedConcerns, recommendations, processingTimeMs, createdBy } = req.body;

  if (!childId || !analysisType) {
    return res.status(400).json({ error: "childId and analysisType are required" });
  }

  const [row] = await db.insert(aiAnalysisResultsTable).values({
    childId, screeningId, analysisType, modelUsed: modelUsed ?? "gemini",
    inputSummary, rawOutput, structuredInsights, confidenceScore,
    flaggedConcerns, recommendations, processingTimeMs, createdBy,
  }).returning();

  return res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

export default router;
