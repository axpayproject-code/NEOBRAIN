import { Router } from "express";
import { db, reportsTable, childrenTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { GetReportParams, ListReportsQueryParams } from "@workspace/api-zod";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

// List reports — scoped to authenticated user
router.get("/reports", async (req, res) => {
  const userId = getUserId(req);
  const parsed = ListReportsQueryParams.safeParse(req.query);
  const childId = parsed.success && parsed.data.childId ? Number(parsed.data.childId) : undefined;

  const conditions = [];
  if (userId) conditions.push(eq(childrenTable.userId, userId));
  if (childId) conditions.push(eq(reportsTable.childId, childId));

  const query = db
    .select({ report: reportsTable, childName: childrenTable.fullName })
    .from(reportsTable)
    .leftJoin(childrenTable, eq(reportsTable.childId, childrenTable.id))
    .orderBy(desc(reportsTable.createdAt));

  const results = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

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
