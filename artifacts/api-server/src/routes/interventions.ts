import { Router } from "express";
import { db } from "@workspace/db";
import { interventionsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/interventions", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const childId = req.query.childId ? parseInt(req.query.childId as string) : null;
  const where = childId
    ? and(eq(interventionsTable.schoolUserId, userId), eq(interventionsTable.childId, childId))
    : eq(interventionsTable.schoolUserId, userId);
  return res.json(await db.select().from(interventionsTable).where(where).orderBy(desc(interventionsTable.createdAt)));
});

router.post("/interventions", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const body = req.body as Record<string, unknown>;
  if (!body.childId || !body.title || !body.interventionType) return res.status(400).json({ error: "childId, title, interventionType required" });
  const textFields = ["title","interventionType","targetDomain","description","strategy","materials","implementedBy","frequency","duration","targetBehavior","successCriteria","baselineData","outcome","effectiveness","notes","status"] as const;
  const values: Record<string, unknown> = {
    childId: typeof body.childId === "number" ? body.childId : parseInt(String(body.childId)),
    schoolUserId: userId,
    observationId: body.observationId ? parseInt(String(body.observationId)) : null,
    iepPlanId: body.iepPlanId ? parseInt(String(body.iepPlanId)) : null,
    parentInformed: !!body.parentInformed,
    progressData: body.progressData ?? null,
    startDate: body.startDate ? new Date(String(body.startDate)) : null,
    endDate: body.endDate ? new Date(String(body.endDate)) : null,
  };
  for (const f of textFields) if (typeof body[f] === "string") values[f] = body[f];
  const [intervention] = await db.insert(interventionsTable).values(values as never).returning();
  return res.status(201).json(intervention);
});

router.patch("/interventions/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const textFields = ["title","interventionType","targetDomain","description","strategy","materials","implementedBy","frequency","duration","targetBehavior","successCriteria","baselineData","outcome","effectiveness","notes","status"];
  for (const f of textFields) if (typeof body[f] === "string") updates[f] = body[f];
  if (body.progressData) updates.progressData = body.progressData;
  if (typeof body.parentInformed === "boolean") updates.parentInformed = body.parentInformed;
  if (body.endDate) updates.endDate = new Date(String(body.endDate));
  const [intervention] = await db.update(interventionsTable).set(updates as never)
    .where(and(eq(interventionsTable.id, id), eq(interventionsTable.schoolUserId, userId))).returning();
  if (!intervention) return res.status(404).json({ error: "Not found" });
  return res.json(intervention);
});

export default router;
