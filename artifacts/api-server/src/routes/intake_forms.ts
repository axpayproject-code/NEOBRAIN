import { Router } from "express";
import { db } from "@workspace/db";
import { intakeFormsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/intake-forms", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const childId = req.query.childId ? parseInt(req.query.childId as string) : null;
  const where = childId
    ? and(eq(intakeFormsTable.clinicUserId, userId), eq(intakeFormsTable.childId, childId))
    : eq(intakeFormsTable.clinicUserId, userId);
  const forms = await db.select().from(intakeFormsTable).where(where).orderBy(desc(intakeFormsTable.createdAt));
  return res.json(forms);
});

router.get("/intake-forms/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  const [form] = await db.select().from(intakeFormsTable).where(and(eq(intakeFormsTable.id, id), eq(intakeFormsTable.clinicUserId, userId)));
  if (!form) return res.status(404).json({ error: "Not found" });
  return res.json(form);
});

router.post("/intake-forms", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const body = req.body as Record<string, unknown>;
  if (!body.childId) return res.status(400).json({ error: "childId is required" });
  const [form] = await db.insert(intakeFormsTable).values({
    childId: typeof body.childId === "number" ? body.childId : parseInt(String(body.childId)),
    clinicUserId: userId,
    chiefComplaint: typeof body.chiefComplaint === "string" ? body.chiefComplaint : null,
    presentingConcerns: typeof body.presentingConcerns === "string" ? body.presentingConcerns : null,
    developmentalHistory: typeof body.developmentalHistory === "string" ? body.developmentalHistory : null,
    birthHistory: typeof body.birthHistory === "string" ? body.birthHistory : null,
    medicalHistory: typeof body.medicalHistory === "string" ? body.medicalHistory : null,
    familyHistory: typeof body.familyHistory === "string" ? body.familyHistory : null,
    socialHistory: typeof body.socialHistory === "string" ? body.socialHistory : null,
    previousInterventions: typeof body.previousInterventions === "string" ? body.previousInterventions : null,
    currentMedications: typeof body.currentMedications === "string" ? body.currentMedications : null,
    allergies: typeof body.allergies === "string" ? body.allergies : null,
    immunizationStatus: typeof body.immunizationStatus === "string" ? body.immunizationStatus : null,
    schoolPerformance: typeof body.schoolPerformance === "string" ? body.schoolPerformance : null,
    behaviorAtHome: typeof body.behaviorAtHome === "string" ? body.behaviorAtHome : null,
    parentConcerns: typeof body.parentConcerns === "string" ? body.parentConcerns : null,
    clinicianObservations: typeof body.clinicianObservations === "string" ? body.clinicianObservations : null,
    triageLevel: typeof body.triageLevel === "string" ? body.triageLevel : "routine",
    status: "draft",
  }).returning();
  return res.status(201).json(form);
});

router.patch("/intake-forms/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  const body = req.body as Record<string, unknown>;
  const now = new Date();
  const updateData: Record<string, unknown> = { updatedAt: now };
  const textFields = ["chiefComplaint","presentingConcerns","developmentalHistory","birthHistory","medicalHistory","familyHistory","socialHistory","previousInterventions","currentMedications","allergies","immunizationStatus","schoolPerformance","behaviorAtHome","parentConcerns","clinicianObservations","triageLevel","status"];
  for (const f of textFields) if (typeof body[f] === "string") updateData[f] = body[f];
  if (body.isComplete === true) { updateData.isComplete = true; updateData.completedAt = now; updateData.status = "complete"; }
  const [form] = await db.update(intakeFormsTable).set(updateData as never).where(and(eq(intakeFormsTable.id, id), eq(intakeFormsTable.clinicUserId, userId))).returning();
  if (!form) return res.status(404).json({ error: "Not found" });
  return res.json(form);
});

export default router;
