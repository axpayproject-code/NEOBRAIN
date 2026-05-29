import { Router } from "express";
import { db, developmentalMilestonesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

function serialize(r: typeof developmentalMilestonesTable.$inferSelect) {
  return {
    ...r,
    achievedAt: r.achievedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/developmental-milestones", async (req, res) => {
  const childId = req.query.childId ? Number(req.query.childId) : undefined;
  const domain = req.query.domain as string | undefined;

  const conditions = [];
  if (childId) conditions.push(eq(developmentalMilestonesTable.childId, childId));
  if (domain) conditions.push(eq(developmentalMilestonesTable.domain, domain));

  const rows = conditions.length > 0
    ? await db.select().from(developmentalMilestonesTable).where(and(...conditions)).orderBy(desc(developmentalMilestonesTable.createdAt))
    : await db.select().from(developmentalMilestonesTable).orderBy(desc(developmentalMilestonesTable.createdAt));

  return res.json(rows.map(serialize));
});

router.post("/developmental-milestones", async (req, res) => {
  const { childId, domain, milestone, typicalAgeMonths, status, achievedAt,
    observedBy, notes, isDelayed, screeningId } = req.body;

  if (!childId || !domain || !milestone) {
    return res.status(400).json({ error: "childId, domain, and milestone are required" });
  }

  const [row] = await db.insert(developmentalMilestonesTable).values({
    childId, domain, milestone, typicalAgeMonths,
    status: status ?? "pending",
    achievedAt: achievedAt ? new Date(achievedAt) : undefined,
    observedBy, notes,
    isDelayed: isDelayed ?? false,
    screeningId,
  }).returning();

  return res.status(201).json(serialize(row));
});

router.patch("/developmental-milestones/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const allowed = ["status", "achievedAt", "observedBy", "notes", "isDelayed"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = key === "achievedAt" ? new Date(req.body[key]) : req.body[key];
    }
  }

  const [row] = await db.update(developmentalMilestonesTable).set(updates)
    .where(eq(developmentalMilestonesTable.id, id)).returning();
  if (!row) return res.status(404).json({ error: "Not found" });

  return res.json(serialize(row));
});

export default router;
