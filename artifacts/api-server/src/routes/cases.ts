import {
  canAccessCase,
  visibleResults,
  supportedChildAge,
} from "../lib/case-policy";
import { Router } from "express";
import { z } from "zod";
import { eq, or, desc, and } from "drizzle-orm";
import {
  db,
  casesTable,
  caseResultsTable,
  caseTasksTable,
  childrenTable,
  professionalProfilesTable,
  usersTable,
  auditLogsTable,
} from "@workspace/db";
const router = Router();
router.param("caseId", async (req, res, next, value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1)
    return res.status(400).json({ error: "Invalid case" });
  const [record] = await db
    .select()
    .from(casesTable)
    .where(eq(casesTable.id, id));
  const user = res.locals.user;
  if (!record || !canAccessCase(user, record))
    return res.status(404).json({ error: "Case unavailable" });
  res.locals.case = record;
  return next();
});
router.get("/cases", async (req, res) => {
  const u = res.locals.user;
  const records = await db
    .select()
    .from(casesTable)
    .where(
      u.role === "superadmin"
        ? undefined
        : or(eq(casesTable.ownerId, u.id), eq(casesTable.reviewerId, u.id)),
    )
    .orderBy(desc(casesTable.createdAt));
  return res.json(
    records.map((record) =>
      u.role === "superadmin" &&
      record.reviewerId !== u.id &&
      record.ownerId !== u.id
        ? {
            ...record,
            observations: "Clinical content restricted to assigned care team",
          }
        : record,
    ),
  );
});
router.post("/cases", async (req, res) => {
  const body = z
    .object({
      childId: z.number().int().positive(),
      title: z.string().trim().min(3).max(200),
      observations: z.string().trim().min(10).max(20000),
      consent: z.literal(true),
    })
    .safeParse(req.body);
  if (!body.success)
    return res
      .status(400)
      .json({ error: "Complete the case and confirm consent" });
  const [child] = await db
    .select()
    .from(childrenTable)
    .where(
      and(
        eq(childrenTable.id, body.data.childId),
        eq(childrenTable.userId, res.locals.user.id),
      ),
    );
  if (!child) return res.status(404).json({ error: "Child unavailable" });
  const now = new Date();
  if (!supportedChildAge(child.dateOfBirth, now))
    return res
      .status(400)
      .json({ error: "New cases support children from birth through age 12" });
  const [record] = await db
    .insert(casesTable)
    .values({
      childId: child.id,
      ownerId: res.locals.user.id,
      title: body.data.title,
      observations: body.data.observations,
      consentAt: now,
    })
    .returning();
  return res.status(201).json(record);
});
router.get("/cases/:caseId", async (req, res) => {
  const record = res.locals.case;
  const family = res.locals.user.id === record.ownerId;
  const clinicalAccess = family || res.locals.user.id === record.reviewerId;
  const results = await db
    .select()
    .from(caseResultsTable)
    .where(
      family
        ? and(
            eq(caseResultsTable.caseId, record.id),
            eq(caseResultsTable.status, "approved"),
          )
        : eq(caseResultsTable.caseId, record.id),
    )
    .orderBy(desc(caseResultsTable.createdAt));
  const tasks = await db
    .select()
    .from(caseTasksTable)
    .where(eq(caseTasksTable.caseId, record.id))
    .orderBy(desc(caseTasksTable.createdAt));
  return res.json({
    ...record,
    results: clinicalAccess ? visibleResults(results, family) : [],
    observations: clinicalAccess
      ? record.observations
      : "Clinical content restricted to assigned care team",
    tasks: !clinicalAccess
      ? []
      : family
        ? tasks.filter((t) => t.kind !== "worknote")
        : tasks,
  });
});
router.get("/case-reviewers", async (req, res) => {
  if (res.locals.user.role !== "superadmin")
    return res.status(403).json({ error: "Administrator access required" });
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      specialty: professionalProfilesTable.specialty,
      licenseNumber: professionalProfilesTable.licenseNumber,
      verifiedAt: professionalProfilesTable.verifiedAt,
    })
    .from(professionalProfilesTable)
    .innerJoin(usersTable, eq(usersTable.id, professionalProfilesTable.userId));
  return res.json(rows);
});
router.post("/professional-profile", async (req, res) => {
  if (res.locals.user.role !== "clinic")
    return res.status(403).json({ error: "Clinical account required" });
  const parsed = z
    .object({
      specialty: z.string().trim().min(2),
      licenseNumber: z.string().trim().min(3),
    })
    .safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: "Specialty and credential number required" });
  await db
    .insert(professionalProfilesTable)
    .values({ userId: res.locals.user.id, ...parsed.data })
    .onConflictDoUpdate({
      target: professionalProfilesTable.userId,
      set: { ...parsed.data, verifiedAt: null, verifiedBy: null },
    });
  return res.json({ status: "pending_verification" });
});
router.post("/professional-profile/:userId/verify", async (req, res) => {
  if (res.locals.user.role !== "superadmin")
    return res.status(403).json({ error: "Administrator access required" });
  if (!z.string().uuid().safeParse(req.params.userId).success)
    return res.status(400).json({ error: "Invalid professional" });
  const [profile] = await db
    .update(professionalProfilesTable)
    .set({ verifiedBy: res.locals.user.id, verifiedAt: new Date() })
    .where(eq(professionalProfilesTable.userId, String(req.params.userId)))
    .returning();
  if (!profile) return res.status(404).json({ error: "Profile unavailable" });
  await db.insert(auditLogsTable).values({
    userId: res.locals.user.id,
    action: "verify_professional",
    resourceType: "professional",
    resourceId: String(req.params.userId),
  });
  return res.json(profile);
});
router.post("/cases/:caseId/assign", async (req, res) => {
  if (res.locals.user.role !== "superadmin")
    return res
      .status(403)
      .json({ error: "Assignment requires an authorized administrator" });
  const parsed = z
    .object({ reviewerId: z.string().uuid() })
    .safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Select a reviewer" });
  const [p] = await db
    .select()
    .from(professionalProfilesTable)
    .where(eq(professionalProfilesTable.userId, parsed.data.reviewerId));
  if (!p?.verifiedAt)
    return res
      .status(400)
      .json({ error: "Reviewer credentials must be verified" });
  const [record] = await db
    .update(casesTable)
    .set({ reviewerId: p.userId, status: "assigned" })
    .where(eq(casesTable.id, res.locals.case.id))
    .returning();
  return res.json(record);
});
router.post("/cases/:caseId/accept", async (req, res) => {
  if (
    res.locals.case.reviewerId !== res.locals.user.id ||
    res.locals.case.status !== "assigned"
  )
    return res
      .status(403)
      .json({ error: "Only the assigned reviewer can accept" });
  await db
    .update(casesTable)
    .set({ status: "in_review" })
    .where(eq(casesTable.id, res.locals.case.id));
  return res.json({ status: "in_review" });
});
router.post("/cases/:caseId/results", async (req, res) => {
  if (
    res.locals.case.reviewerId !== res.locals.user.id ||
    !["in_review", "reviewed"].includes(res.locals.case.status)
  )
    return res
      .status(403)
      .json({ error: "Accepted reviewer assignment required" });
  const parsed = z
    .object({ content: z.string().trim().min(10).max(20000) })
    .safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Enter review findings" });
  await db
    .update(casesTable)
    .set({ status: "in_review" })
    .where(eq(casesTable.id, res.locals.case.id));
  const [result] = await db
    .insert(caseResultsTable)
    .values({
      caseId: res.locals.case.id,
      authorId: res.locals.user.id,
      content: parsed.data.content,
    })
    .returning();
  return res.status(201).json(result);
});
router.post("/cases/:caseId/results/:resultId/approve", async (req, res) => {
  const u = res.locals.user;
  const c = res.locals.case;
  if (c.reviewerId !== u.id || c.status !== "in_review")
    return res
      .status(403)
      .json({ error: "Accepted review assignment required" });
  const [p] = await db
    .select()
    .from(professionalProfilesTable)
    .where(eq(professionalProfilesTable.userId, u.id));
  if (!p?.verifiedAt)
    return res
      .status(403)
      .json({ error: "Verified clinical credentials required" });
  const id = z.coerce.number().int().positive().safeParse(req.params.resultId);
  if (!id.success) return res.status(400).json({ error: "Invalid version" });
  const result = await db.transaction(async (tx) => {
    const [approved] = await tx
      .update(caseResultsTable)
      .set({ status: "approved", approvedBy: u.id, approvedAt: new Date() })
      .where(
        and(
          eq(caseResultsTable.id, id.data),
          eq(caseResultsTable.caseId, c.id),
          eq(caseResultsTable.status, "draft"),
        ),
      )
      .returning();
    if (!approved) return null;
    await tx
      .update(casesTable)
      .set({ status: "reviewed" })
      .where(eq(casesTable.id, c.id));
    await tx.insert(auditLogsTable).values({
      userId: u.id,
      action: "approve_clinical_result",
      resourceType: "case_result_version",
      resourceId: String(approved.id),
    });
    return approved;
  });
  if (!result)
    return res
      .status(409)
      .json({ error: "Draft unavailable or already approved" });
  return res.json(result);
});
router.post("/cases/:caseId/tasks", async (req, res) => {
  const c = res.locals.case;
  const u = res.locals.user;
  const parsed = z
    .object({
      kind: z.enum([
        "worknote",
        "information_request",
        "referral",
        "follow_up",
      ]),
      content: z.string().trim().min(3).max(10000),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid task" });
  if (c.reviewerId !== u.id)
    return res.status(403).json({ error: "Assigned clinician required" });
  if (parsed.data.kind === "referral" && c.status !== "reviewed")
    return res
      .status(409)
      .json({ error: "Approve clinical review before issuing referral" });
  const [task] = await db
    .insert(caseTasksTable)
    .values({ caseId: c.id, authorId: u.id, ...parsed.data })
    .returning();
  return res.status(201).json(task);
});
router.post("/cases/:caseId/tasks/:taskId/complete", async (req, res) => {
  const id = z.coerce.number().int().positive().safeParse(req.params.taskId);
  if (!id.success) return res.status(400).json({ error: "Invalid task" });
  const [task] = await db
    .select()
    .from(caseTasksTable)
    .where(
      and(
        eq(caseTasksTable.id, id.data),
        eq(caseTasksTable.caseId, res.locals.case.id),
      ),
    );
  if (
    !task ||
    (res.locals.user.id === res.locals.case.ownerId &&
      task.kind !== "information_request" &&
      task.kind !== "follow_up")
  )
    return res.status(403).json({ error: "Task unavailable" });
  const [updated] = await db
    .update(caseTasksTable)
    .set({ status: "completed" })
    .where(eq(caseTasksTable.id, task.id))
    .returning();
  return res.json(updated);
});
export default router;
