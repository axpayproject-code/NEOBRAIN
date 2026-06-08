import { Router } from "express";
import { db } from "@workspace/db";
import { healthProgramsTable, usersTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/health-programs", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const programs = await db.select().from(healthProgramsTable)
    .where(eq(healthProgramsTable.govUserId, userId))
    .orderBy(desc(healthProgramsTable.createdAt));
  return res.json(programs);
});

router.get("/health-programs/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [program] = await db.select().from(healthProgramsTable)
    .where(and(eq(healthProgramsTable.id, parseInt(req.params.id)), eq(healthProgramsTable.govUserId, userId)));
  if (!program) return res.status(404).json({ error: "Not found" });
  return res.json(program);
});

router.post("/health-programs", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [user] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user || (user.role !== "government" && user.role !== "superadmin")) {
    return res.status(403).json({ error: "Government access required" });
  }
  const body = req.body as Record<string, unknown>;
  if (!body.programName || !body.category) return res.status(400).json({ error: "programName and category required" });
  const textFields = ["programName","programCode","category","description","targetRegion","targetProvince","targetMunicipality","targetBarangay","targetPopulation","fundingSource","implementingAgency","status"] as const;
  const values: Record<string, unknown> = {
    govUserId: userId,
    targetCount: body.targetCount ? parseInt(String(body.targetCount)) : null,
    budget: body.budget ? parseFloat(String(body.budget)) : null,
    partnerAgencies: body.partnerAgencies ?? null,
    keyIndicators: body.keyIndicators ?? null,
    isNational: !!body.isNational,
    startDate: body.startDate ? new Date(String(body.startDate)) : null,
    endDate: body.endDate ? new Date(String(body.endDate)) : null,
  };
  for (const f of textFields) if (typeof body[f] === "string") values[f] = body[f];
  const [program] = await db.insert(healthProgramsTable).values(values as never).returning();
  return res.status(201).json(program);
});

router.patch("/health-programs/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const textFields = ["programName","programCode","category","description","targetRegion","targetProvince","targetMunicipality","targetBarangay","targetPopulation","fundingSource","implementingAgency","status"];
  for (const f of textFields) if (typeof body[f] === "string") updates[f] = body[f];
  if (typeof body.enrolledCount === "number") updates.enrolledCount = body.enrolledCount;
  if (typeof body.completedCount === "number") updates.completedCount = body.completedCount;
  if (typeof body.progressPercentage === "number") updates.progressPercentage = body.progressPercentage;
  if (typeof body.expenditure === "number") updates.expenditure = body.expenditure;
  if (body.keyIndicators) updates.keyIndicators = body.keyIndicators;
  if (body.reports) updates.reports = body.reports;
  const [program] = await db.update(healthProgramsTable).set(updates as never)
    .where(and(eq(healthProgramsTable.id, id), eq(healthProgramsTable.govUserId, userId))).returning();
  if (!program) return res.status(404).json({ error: "Not found" });
  return res.json(program);
});

export default router;
