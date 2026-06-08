import { Router } from "express";
import { db } from "@workspace/db";
import { queueEntriesTable } from "@workspace/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

const router = Router();

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/queue", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const date = typeof req.query.date === "string" ? req.query.date : new Date().toISOString().slice(0, 10);
  const entries = await db.select().from(queueEntriesTable)
    .where(and(eq(queueEntriesTable.clinicUserId, userId), eq(queueEntriesTable.queueDate, date)))
    .orderBy(queueEntriesTable.queueNumber);
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(queueEntriesTable)
    .where(and(eq(queueEntriesTable.clinicUserId, userId), eq(queueEntriesTable.queueDate, date), eq(queueEntriesTable.status, "waiting")));
  return res.json({ entries, waitingCount: count, date });
});

router.post("/queue", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { childId, childName, triageLevel, appointmentId, notes } = req.body as Record<string, unknown>;
  if (!childId || !childName) return res.status(400).json({ error: "childId and childName required" });
  const date = new Date().toISOString().slice(0, 10);
  const [{ maxNum }] = await db.select({ maxNum: sql<number>`coalesce(max(queue_number), 0)::int` }).from(queueEntriesTable)
    .where(and(eq(queueEntriesTable.clinicUserId, userId), eq(queueEntriesTable.queueDate, date)));
  const [entry] = await db.insert(queueEntriesTable).values({
    childId: typeof childId === "number" ? childId : parseInt(String(childId)),
    childName: String(childName),
    clinicUserId: userId,
    queueDate: date,
    queueNumber: (maxNum ?? 0) + 1,
    appointmentId: appointmentId ? (typeof appointmentId === "number" ? appointmentId : parseInt(String(appointmentId))) : null,
    triageLevel: typeof triageLevel === "string" ? triageLevel : "routine",
    notes: typeof notes === "string" ? notes : null,
  }).returning();
  return res.status(201).json(entry);
});

router.patch("/queue/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  const { status, triageLevel, estimatedWaitMinutes, notes } = req.body as Record<string, unknown>;
  const now = new Date();
  const updateData: Record<string, unknown> = {};
  if (typeof status === "string") {
    updateData.status = status;
    if (status === "called") updateData.calledAt = now;
    else if (status === "in_progress") updateData.checkedInAt = now;
    else if (status === "completed" || status === "no_show") updateData.completedAt = now;
  }
  if (typeof triageLevel === "string") updateData.triageLevel = triageLevel;
  if (typeof estimatedWaitMinutes === "number") updateData.estimatedWaitMinutes = estimatedWaitMinutes;
  if (typeof notes === "string") updateData.notes = notes;
  const [entry] = await db.update(queueEntriesTable).set(updateData as never)
    .where(and(eq(queueEntriesTable.id, id), eq(queueEntriesTable.clinicUserId, userId))).returning();
  if (!entry) return res.status(404).json({ error: "Not found" });
  return res.json(entry);
});

router.delete("/queue/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  await db.delete(queueEntriesTable).where(and(eq(queueEntriesTable.id, id), eq(queueEntriesTable.clinicUserId, userId)));
  return res.json({ ok: true });
});

export default router;
