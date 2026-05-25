import { Router } from "express";
import { db, reportsTable, childrenTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { GetReportParams, ListReportsQueryParams } from "@workspace/api-zod";

const router = Router();

// List reports
router.get("/reports", async (req, res) => {
  const parsed = ListReportsQueryParams.safeParse(req.query);
  const childId = parsed.success && parsed.data.childId ? Number(parsed.data.childId) : undefined;

  let results;
  if (childId) {
    results = await db
      .select({ report: reportsTable, childName: childrenTable.fullName })
      .from(reportsTable)
      .leftJoin(childrenTable, eq(reportsTable.childId, childrenTable.id))
      .where(eq(reportsTable.childId, childId))
      .orderBy(desc(reportsTable.createdAt));
  } else {
    results = await db
      .select({ report: reportsTable, childName: childrenTable.fullName })
      .from(reportsTable)
      .leftJoin(childrenTable, eq(reportsTable.childId, childrenTable.id))
      .orderBy(desc(reportsTable.createdAt));
  }

  return res.json(
    results.map(({ report, childName }) => ({
      ...report,
      childName: childName ?? null,
      createdAt: report.createdAt.toISOString(),
    }))
  );
});

// Get a report
router.get("/reports/:id", async (req, res) => {
  const parsed = GetReportParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [result] = await db
    .select({ report: reportsTable, childName: childrenTable.fullName })
    .from(reportsTable)
    .leftJoin(childrenTable, eq(reportsTable.childId, childrenTable.id))
    .where(eq(reportsTable.id, parsed.data.id));

  if (!result) return res.status(404).json({ error: "Not found" });

  return res.json({
    ...result.report,
    childName: result.childName ?? null,
    createdAt: result.report.createdAt.toISOString(),
  });
});

export default router;
