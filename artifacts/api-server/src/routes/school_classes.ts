import { Router } from "express";
import { db } from "@workspace/db";
import { schoolClassesTable, classEnrollmentsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/school-classes", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const classes = await db.select().from(schoolClassesTable)
    .where(and(eq(schoolClassesTable.schoolUserId, userId), eq(schoolClassesTable.isActive, true)))
    .orderBy(desc(schoolClassesTable.createdAt));
  return res.json(classes);
});

router.get("/school-classes/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  const [cls] = await db.select().from(schoolClassesTable).where(and(eq(schoolClassesTable.id, id), eq(schoolClassesTable.schoolUserId, userId)));
  if (!cls) return res.status(404).json({ error: "Not found" });
  const enrollments = await db.select().from(classEnrollmentsTable).where(eq(classEnrollmentsTable.classId, id));
  return res.json({ ...cls, enrollments });
});

router.post("/school-classes", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const body = req.body as Record<string, unknown>;
  if (!body.className || !body.gradeLevel || !body.teacherName) return res.status(400).json({ error: "className, gradeLevel, teacherName required" });
  const [cls] = await db.insert(schoolClassesTable).values({
    schoolUserId: userId,
    teacherName: String(body.teacherName),
    className: String(body.className),
    gradeLevel: String(body.gradeLevel),
    section: typeof body.section === "string" ? body.section : null,
    schoolYear: typeof body.schoolYear === "string" ? body.schoolYear : new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    schoolName: typeof body.schoolName === "string" ? body.schoolName : null,
    campusName: typeof body.campusName === "string" ? body.campusName : null,
    room: typeof body.room === "string" ? body.room : null,
    schedule: typeof body.schedule === "string" ? body.schedule : null,
  }).returning();
  return res.status(201).json(cls);
});

router.patch("/school-classes/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const f of ["className","gradeLevel","section","schoolYear","schoolName","campusName","room","schedule","teacherName"]) {
    if (typeof body[f] === "string") updates[f] = body[f];
  }
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
  const [cls] = await db.update(schoolClassesTable).set(updates as never)
    .where(and(eq(schoolClassesTable.id, id), eq(schoolClassesTable.schoolUserId, userId))).returning();
  if (!cls) return res.status(404).json({ error: "Not found" });
  return res.json(cls);
});

router.post("/school-classes/:id/enroll", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const classId = parseInt(req.params.id);
  const { childId, childName, notes } = req.body as Record<string, unknown>;
  if (!childId || !childName) return res.status(400).json({ error: "childId and childName required" });
  const [enrollment] = await db.insert(classEnrollmentsTable).values({
    classId,
    childId: typeof childId === "number" ? childId : parseInt(String(childId)),
    childName: String(childName),
    notes: typeof notes === "string" ? notes : null,
  }).returning();
  return res.status(201).json(enrollment);
});

router.delete("/school-classes/:classId/enroll/:childId", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const classId = parseInt(req.params.classId);
  const childId = parseInt(req.params.childId);
  await db.delete(classEnrollmentsTable).where(and(eq(classEnrollmentsTable.classId, classId), eq(classEnrollmentsTable.childId, childId)));
  return res.json({ ok: true });
});

export default router;
