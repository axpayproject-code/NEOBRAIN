import { Router } from "express";
import { db } from "@workspace/db";
import { iepPlansTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/iep-plans", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const childId = req.query.childId ? parseInt(req.query.childId as string) : null;
  const where = childId
    ? and(eq(iepPlansTable.schoolUserId, userId), eq(iepPlansTable.childId, childId))
    : eq(iepPlansTable.schoolUserId, userId);
  return res.json(await db.select().from(iepPlansTable).where(where).orderBy(desc(iepPlansTable.createdAt)));
});

router.get("/iep-plans/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [plan] = await db.select().from(iepPlansTable).where(
    and(eq(iepPlansTable.id, parseInt(req.params.id)), eq(iepPlansTable.schoolUserId, userId))
  );
  if (!plan) return res.status(404).json({ error: "Not found" });
  return res.json(plan);
});

router.post("/iep-plans", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const body = req.body as Record<string, unknown>;
  if (!body.childId || !body.coordinatorName) return res.status(400).json({ error: "childId and coordinatorName required" });
  const [plan] = await db.insert(iepPlansTable).values({
    childId: typeof body.childId === "number" ? body.childId : parseInt(String(body.childId)),
    schoolUserId: userId,
    coordinatorName: String(body.coordinatorName),
    academicYear: typeof body.academicYear === "string" ? body.academicYear : new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    schoolName: typeof body.schoolName === "string" ? body.schoolName : null,
    gradeLevel: typeof body.gradeLevel === "string" ? body.gradeLevel : null,
    exceptionality: typeof body.exceptionality === "string" ? body.exceptionality : null,
    disabilities: typeof body.disabilities === "string" ? body.disabilities : null,
    presentLevelOfPerformance: typeof body.presentLevelOfPerformance === "string" ? body.presentLevelOfPerformance : null,
    annualGoals: body.annualGoals ?? null,
    shortTermObjectives: body.shortTermObjectives ?? null,
    specialServices: body.specialServices ?? null,
    accommodations: body.accommodations ?? null,
    modifications: body.modifications ?? null,
    participationInRegularClass: typeof body.participationInRegularClass === "string" ? body.participationInRegularClass : null,
    assessmentAccommodations: typeof body.assessmentAccommodations === "string" ? body.assessmentAccommodations : null,
    transitionServices: typeof body.transitionServices === "string" ? body.transitionServices : null,
    parentInvolvement: typeof body.parentInvolvement === "string" ? body.parentInvolvement : null,
    status: typeof body.status === "string" ? body.status : "draft",
    parentConsentGiven: !!body.parentConsentGiven,
    implementationDate: body.implementationDate ? new Date(String(body.implementationDate)) : null,
    expirationDate: body.expirationDate ? new Date(String(body.expirationDate)) : null,
  }).returning();
  return res.status(201).json(plan);
});

router.patch("/iep-plans/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const textFields = ["coordinatorName","schoolName","gradeLevel","exceptionality","disabilities","presentLevelOfPerformance","participationInRegularClass","assessmentAccommodations","transitionServices","parentInvolvement","status","academicYear"];
  for (const f of textFields) if (typeof body[f] === "string") updates[f] = body[f];
  const jsonFields = ["annualGoals","shortTermObjectives","specialServices","accommodations","modifications","progressNotes","partnerAgencies"];
  for (const f of jsonFields) if (body[f]) updates[f] = body[f];
  if (typeof body.parentConsentGiven === "boolean") { updates.parentConsentGiven = body.parentConsentGiven; if (body.parentConsentGiven) updates.parentConsentDate = new Date(); }
  const [plan] = await db.update(iepPlansTable).set(updates as never).where(and(eq(iepPlansTable.id, id), eq(iepPlansTable.schoolUserId, userId))).returning();
  if (!plan) return res.status(404).json({ error: "Not found" });
  return res.json(plan);
});

export default router;
