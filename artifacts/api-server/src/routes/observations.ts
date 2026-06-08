import { Router } from "express";
import { db } from "@workspace/db";
import { teacherObservationsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/observations", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const childId = req.query.childId ? parseInt(req.query.childId as string) : null;
  const where = childId
    ? and(eq(teacherObservationsTable.schoolUserId, userId), eq(teacherObservationsTable.childId, childId))
    : eq(teacherObservationsTable.schoolUserId, userId);
  return res.json(await db.select().from(teacherObservationsTable).where(where).orderBy(desc(teacherObservationsTable.observationDate)));
});

router.get("/observations/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [obs] = await db.select().from(teacherObservationsTable).where(
    and(eq(teacherObservationsTable.id, parseInt(req.params.id)), eq(teacherObservationsTable.schoolUserId, userId))
  );
  if (!obs) return res.status(404).json({ error: "Not found" });
  return res.json(obs);
});

router.post("/observations", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const body = req.body as Record<string, unknown>;
  if (!body.childId || !body.teacherName) return res.status(400).json({ error: "childId and teacherName required" });
  const fields = ["setting","academicPerformance","socialInteraction","attentionFocus","behaviorConcerns","languageCommunication","motorSkills","emotionalRegulation","strengths","areasOfConcern","recommendedActions"] as const;
  const values: Record<string, unknown> = {
    childId: typeof body.childId === "number" ? body.childId : parseInt(String(body.childId)),
    schoolUserId: userId,
    teacherName: String(body.teacherName),
    classId: body.classId ? (typeof body.classId === "number" ? body.classId : parseInt(String(body.classId))) : null,
    duration: body.duration ? parseInt(String(body.duration)) : null,
    parentNotified: !!body.parentNotified,
    followUpRequired: !!body.followUpRequired,
    domainRatings: body.domainRatings ?? null,
  };
  for (const f of fields) if (typeof body[f] === "string") values[f] = body[f];
  const [obs] = await db.insert(teacherObservationsTable).values(values as never).returning();
  return res.status(201).json(obs);
});

router.patch("/observations/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const fields = ["setting","academicPerformance","socialInteraction","attentionFocus","behaviorConcerns","languageCommunication","motorSkills","emotionalRegulation","strengths","areasOfConcern","recommendedActions","status"];
  for (const f of fields) if (typeof body[f] === "string") updates[f] = body[f];
  if (typeof body.parentNotified === "boolean") updates.parentNotified = body.parentNotified;
  if (typeof body.followUpRequired === "boolean") updates.followUpRequired = body.followUpRequired;
  if (body.domainRatings) updates.domainRatings = body.domainRatings;
  const [obs] = await db.update(teacherObservationsTable).set(updates as never)
    .where(and(eq(teacherObservationsTable.id, id), eq(teacherObservationsTable.schoolUserId, userId))).returning();
  if (!obs) return res.status(404).json({ error: "Not found" });
  return res.json(obs);
});

export default router;
