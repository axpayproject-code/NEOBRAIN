import { Router } from "express";
import { db, therapySessionNotesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

function serialize(r: typeof therapySessionNotesTable.$inferSelect) {
  return {
    ...r,
    sessionDate: r.sessionDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/therapy-session-notes", async (req, res) => {
  const therapyPlanId = req.query.therapyPlanId ? Number(req.query.therapyPlanId) : undefined;
  const childId = req.query.childId ? Number(req.query.childId) : undefined;

  const conditions = [];
  if (therapyPlanId) conditions.push(eq(therapySessionNotesTable.therapyPlanId, therapyPlanId));
  if (childId) conditions.push(eq(therapySessionNotesTable.childId, childId));

  const rows = conditions.length > 0
    ? await db.select().from(therapySessionNotesTable).where(and(...conditions)).orderBy(desc(therapySessionNotesTable.sessionDate))
    : await db.select().from(therapySessionNotesTable).orderBy(desc(therapySessionNotesTable.sessionDate));

  return res.json(rows.map(serialize));
});

router.post("/therapy-session-notes", async (req, res) => {
  const { therapyPlanId, childId, sessionNumber, sessionDate, therapistName, sessionType,
    durationMinutes, goalsAddressed, activitiesPerformed, childResponse, progressObserved,
    challenges, parentFeedback, nextSessionPlan, overallRating, createdBy } = req.body;

  if (!therapyPlanId || !childId || !sessionNumber || !sessionDate) {
    return res.status(400).json({ error: "therapyPlanId, childId, sessionNumber, and sessionDate are required" });
  }

  const [row] = await db.insert(therapySessionNotesTable).values({
    therapyPlanId, childId, sessionNumber, sessionDate: new Date(sessionDate),
    therapistName, sessionType: sessionType ?? "in-person", durationMinutes,
    goalsAddressed, activitiesPerformed, childResponse, progressObserved,
    challenges, parentFeedback, nextSessionPlan, overallRating, createdBy,
  }).returning();

  return res.status(201).json(serialize(row));
});

router.patch("/therapy-session-notes/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const allowed = ["goalsAddressed","activitiesPerformed","childResponse","progressObserved",
    "challenges","parentFeedback","nextSessionPlan","overallRating","durationMinutes","sessionDate"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = key === "sessionDate" ? new Date(req.body[key]) : req.body[key];
    }
  }

  const [row] = await db.update(therapySessionNotesTable).set(updates)
    .where(eq(therapySessionNotesTable.id, id)).returning();
  if (!row) return res.status(404).json({ error: "Not found" });

  return res.json(serialize(row));
});

router.delete("/therapy-session-notes/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const [deleted] = await db.delete(therapySessionNotesTable).where(eq(therapySessionNotesTable.id, id)).returning({ id: therapySessionNotesTable.id });
  if (!deleted) return res.status(404).json({ error: "Not found" });
  return res.status(204).end();
});

export default router;
