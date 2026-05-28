import { Router } from "express";
import { db, therapyPlansTable, childrenTable, timelineEventsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { CreateTherapyPlanBody, GetTherapyPlanParams, ListTherapyPlansQueryParams, UpdateTherapyPlanBody, UpdateTherapyPlanParams } from "@workspace/api-zod";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

// List therapy plans — scoped to authenticated user
router.get("/therapy-plans", async (req, res) => {
  const userId = getUserId(req);
  const parsed = ListTherapyPlansQueryParams.safeParse(req.query);
  const childId = parsed.success && parsed.data.childId ? Number(parsed.data.childId) : undefined;

  const conditions = [];
  if (userId) conditions.push(eq(childrenTable.userId, userId));
  if (childId) conditions.push(eq(therapyPlansTable.childId, childId));

  const query = db
    .select({ plan: therapyPlansTable, childName: childrenTable.fullName })
    .from(therapyPlansTable)
    .leftJoin(childrenTable, eq(therapyPlansTable.childId, childrenTable.id))
    .orderBy(desc(therapyPlansTable.createdAt));

  const results = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

  return res.json(
    results.map(({ plan, childName }) => ({
      ...plan,
      childName: childName ?? null,
      createdAt: plan.createdAt.toISOString(),
    }))
  );
});

// Create a therapy plan
router.post("/therapy-plans", async (req, res) => {
  const parsed = CreateTherapyPlanBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }

  const [plan] = await db.insert(therapyPlansTable).values(parsed.data).returning();

  await db.insert(timelineEventsTable).values({
    childId: parsed.data.childId,
    eventType: "therapy",
    title: `Therapy plan created: ${parsed.data.title}`,
    description: `${parsed.data.therapyType} therapy plan started`,
    occurredAt: new Date(),
  });

  return res.status(201).json({
    ...plan,
    childName: null,
    createdAt: plan.createdAt.toISOString(),
  });
});

// Get a therapy plan
router.get("/therapy-plans/:id", async (req, res) => {
  const parsed = GetTherapyPlanParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [result] = await db
    .select({ plan: therapyPlansTable, childName: childrenTable.fullName })
    .from(therapyPlansTable)
    .leftJoin(childrenTable, eq(therapyPlansTable.childId, childrenTable.id))
    .where(eq(therapyPlansTable.id, parsed.data.id));

  if (!result) return res.status(404).json({ error: "Not found" });

  return res.json({
    ...result.plan,
    childName: result.childName ?? null,
    createdAt: result.plan.createdAt.toISOString(),
  });
});

// Delete a therapy plan
router.delete("/therapy-plans/:id", async (req, res) => {
  const parsed = UpdateTherapyPlanParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [deleted] = await db.delete(therapyPlansTable).where(eq(therapyPlansTable.id, parsed.data.id)).returning({ id: therapyPlansTable.id });
  if (!deleted) return res.status(404).json({ error: "Not found" });
  return res.status(204).end();
});

// Update a therapy plan
router.patch("/therapy-plans/:id", async (req, res) => {
  const paramsParsed = UpdateTherapyPlanParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateTherapyPlanBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const [updated] = await db
    .update(therapyPlansTable)
    .set(bodyParsed.data)
    .where(eq(therapyPlansTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });

  return res.json({
    ...updated,
    childName: null,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
