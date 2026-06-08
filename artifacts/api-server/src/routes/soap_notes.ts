import { Router } from "express";
import { db } from "@workspace/db";
import { soapNotesTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/soap-notes", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const childId = req.query.childId ? parseInt(req.query.childId as string) : null;
  const where = childId
    ? and(eq(soapNotesTable.clinicUserId, userId), eq(soapNotesTable.childId, childId))
    : eq(soapNotesTable.clinicUserId, userId);
  return res.json(await db.select().from(soapNotesTable).where(where).orderBy(desc(soapNotesTable.visitDate)));
});

router.get("/soap-notes/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [note] = await db.select().from(soapNotesTable)
    .where(and(eq(soapNotesTable.id, parseInt(req.params.id)), eq(soapNotesTable.clinicUserId, userId)));
  if (!note) return res.status(404).json({ error: "Not found" });
  return res.json(note);
});

router.post("/soap-notes", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const body = req.body as Record<string, unknown>;
  if (!body.childId || !body.clinicianName) return res.status(400).json({ error: "childId and clinicianName required" });
  const [note] = await db.insert(soapNotesTable).values({
    childId: typeof body.childId === "number" ? body.childId : parseInt(String(body.childId)),
    clinicUserId: userId,
    clinicianName: String(body.clinicianName),
    clinicianRole: typeof body.clinicianRole === "string" ? body.clinicianRole : null,
    appointmentId: body.appointmentId ? (typeof body.appointmentId === "number" ? body.appointmentId : parseInt(String(body.appointmentId))) : null,
    visitDate: body.visitDate ? new Date(String(body.visitDate)) : new Date(),
    subjective: typeof body.subjective === "string" ? body.subjective : null,
    objective: typeof body.objective === "string" ? body.objective : null,
    assessment: typeof body.assessment === "string" ? body.assessment : null,
    plan: typeof body.plan === "string" ? body.plan : null,
    diagnosisCodes: typeof body.diagnosisCodes === "string" ? body.diagnosisCodes : null,
    vitalSigns: body.vitalSigns ?? null,
    followUpDate: body.followUpDate ? new Date(String(body.followUpDate)) : null,
    followUpNotes: typeof body.followUpNotes === "string" ? body.followUpNotes : null,
  }).returning();
  return res.status(201).json(note);
});

router.patch("/soap-notes/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const f of ["subjective","objective","assessment","plan","diagnosisCodes","followUpNotes","isFinalized"]) {
    if (typeof body[f] === "string") updates[f] = body[f];
  }
  if (body.vitalSigns) updates.vitalSigns = body.vitalSigns;
  if (body.followUpDate) updates.followUpDate = new Date(String(body.followUpDate));
  const [note] = await db.update(soapNotesTable).set(updates as never)
    .where(and(eq(soapNotesTable.id, id), eq(soapNotesTable.clinicUserId, userId))).returning();
  if (!note) return res.status(404).json({ error: "Not found" });
  return res.json(note);
});

router.delete("/soap-notes/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  await db.delete(soapNotesTable).where(and(eq(soapNotesTable.id, parseInt(req.params.id)), eq(soapNotesTable.clinicUserId, userId)));
  return res.json({ ok: true });
});

export default router;
