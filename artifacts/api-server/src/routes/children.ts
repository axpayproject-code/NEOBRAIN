import { Router } from "express";
import { db, childrenTable, screeningsTable, appointmentsTable, therapyPlansTable, reportsTable, timelineEventsTable } from "@workspace/db";
import { eq, desc, and, isNull, or } from "drizzle-orm";
import { CreateChildBody, UpdateChildBody, GetChildParams, DeleteChildParams, GetChildDomainScoresParams, GetChildTimelineParams } from "@workspace/api-zod";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    return token || null;
  }
  return null;
}

// List all children (scoped to the authenticated user)
router.get("/children", async (req, res) => {
  const userId = getUserId(req);
  const rows = userId
    ? await db.select().from(childrenTable).where(eq(childrenTable.userId, userId)).orderBy(desc(childrenTable.createdAt))
    : await db.select().from(childrenTable).where(isNull(childrenTable.userId)).orderBy(desc(childrenTable.createdAt));
  return res.json(
    rows.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt?.toISOString() ?? null,
    }))
  );
});

// Create a child — only family and superadmin can create child profiles
router.post("/children", async (req, res) => {
  const parsed = CreateChildBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }
  const userId = getUserId(req);
  if (userId) {
    const { usersTable } = await import("@workspace/db");
    const { eq: eqFn } = await import("drizzle-orm");
    const [creator] = await db.select({ role: usersTable.role }).from(usersTable).where(eqFn(usersTable.id, userId));
    if (creator && creator.role !== "family" && creator.role !== "superadmin") {
      return res.status(403).json({ error: "Only family accounts and administrators can create child profiles." });
    }
  }
  const [child] = await db.insert(childrenTable).values({ ...parsed.data, userId }).returning();
  // Add timeline event
  await db.insert(timelineEventsTable).values({
    childId: child.id,
    eventType: "milestone",
    title: "Profile created",
    description: `${child.fullName}'s profile was added to ACCENTECX AI CARE`,
    occurredAt: new Date(),
  });
  return res.status(201).json({
    ...child,
    createdAt: child.createdAt.toISOString(),
    updatedAt: child.updatedAt?.toISOString() ?? null,
  });
});

// Get a child by ID
router.get("/children/:id", async (req, res) => {
  const parsed = GetChildParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, parsed.data.id));
  if (!child) return res.status(404).json({ error: "Not found" });

  return res.json({
    ...child,
    createdAt: child.createdAt.toISOString(),
    updatedAt: child.updatedAt?.toISOString() ?? null,
  });
});

// Update a child
router.patch("/children/:id", async (req, res) => {
  const paramsParsed = GetChildParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateChildBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const [updated] = await db
    .update(childrenTable)
    .set(bodyParsed.data)
    .where(eq(childrenTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });

  return res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt?.toISOString() ?? null,
  });
});

// Delete a child — only family (owner) and superadmin can delete
router.delete("/children/:id", async (req, res) => {
  const parsed = DeleteChildParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const userId = getUserId(req);
  if (userId) {
    const { usersTable } = await import("@workspace/db");
    const { eq: eqFn } = await import("drizzle-orm");
    const [actor] = await db.select({ role: usersTable.role }).from(usersTable).where(eqFn(usersTable.id, userId));
    if (actor && actor.role !== "family" && actor.role !== "superadmin") {
      return res.status(403).json({ error: "Only family accounts and administrators can delete child profiles." });
    }
  }

  await db.delete(childrenTable).where(eq(childrenTable.id, parsed.data.id));
  return res.status(204).send();
});

// Get domain scores for a child (latest screening scores)
router.get("/children/:id/domain-scores", async (req, res) => {
  const parsed = GetChildDomainScoresParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, parsed.data.id));
  if (!child) return res.status(404).json({ error: "Not found" });

  // Get the most recent completed screening
  const [latestScreening] = await db
    .select()
    .from(screeningsTable)
    .where(eq(screeningsTable.childId, parsed.data.id))
    .orderBy(desc(screeningsTable.createdAt))
    .limit(1);

  return res.json({
    childId: parsed.data.id,
    communication: latestScreening?.communicationScore ?? 50,
    socialInteraction: latestScreening?.socialScore ?? 50,
    attention: latestScreening?.attentionScore ?? 50,
    motorSkills: latestScreening?.motorScore ?? 50,
    emotionalRegulation: latestScreening?.emotionalScore ?? 50,
    assessedAt: latestScreening?.createdAt.toISOString() ?? new Date().toISOString(),
  });
});

// Get timeline for a child
router.get("/children/:id/timeline", async (req, res) => {
  const parsed = GetChildTimelineParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const events = await db
    .select()
    .from(timelineEventsTable)
    .where(eq(timelineEventsTable.childId, parsed.data.id))
    .orderBy(desc(timelineEventsTable.occurredAt));

  return res.json(
    events.map((e) => ({
      ...e,
      occurredAt: e.occurredAt.toISOString(),
    }))
  );
});

export default router;
