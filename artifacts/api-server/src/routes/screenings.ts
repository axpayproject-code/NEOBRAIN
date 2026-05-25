import { Router } from "express";
import { db, screeningsTable, childrenTable, timelineEventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateScreeningBody, GetScreeningParams, ListScreeningsQueryParams } from "@workspace/api-zod";

const router = Router();

// List screenings (optionally filter by childId)
router.get("/screenings", async (req, res) => {
  const parsed = ListScreeningsQueryParams.safeParse(req.query);
  const childId = parsed.success && parsed.data.childId ? Number(parsed.data.childId) : undefined;

  let screenings;
  if (childId) {
    screenings = await db
      .select({
        screening: screeningsTable,
        childName: childrenTable.fullName,
      })
      .from(screeningsTable)
      .leftJoin(childrenTable, eq(screeningsTable.childId, childrenTable.id))
      .where(eq(screeningsTable.childId, childId))
      .orderBy(desc(screeningsTable.createdAt));
  } else {
    screenings = await db
      .select({
        screening: screeningsTable,
        childName: childrenTable.fullName,
      })
      .from(screeningsTable)
      .leftJoin(childrenTable, eq(screeningsTable.childId, childrenTable.id))
      .orderBy(desc(screeningsTable.createdAt));
  }

  return res.json(
    screenings.map(({ screening, childName }) => ({
      ...screening,
      childName: childName ?? null,
      createdAt: screening.createdAt.toISOString(),
      completedAt: screening.completedAt?.toISOString() ?? null,
    }))
  );
});

// Create a screening
router.post("/screenings", async (req, res) => {
  const parsed = CreateScreeningBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }

  // Determine risk level based on scores
  const scores = [
    parsed.data.communicationScore,
    parsed.data.socialScore,
    parsed.data.attentionScore,
    parsed.data.motorScore,
    parsed.data.emotionalScore,
  ].filter((s): s is number => s !== undefined && s !== null);

  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  let riskLevel: string | null = null;
  if (avgScore !== null) {
    if (avgScore >= 70) riskLevel = "low";
    else if (avgScore >= 50) riskLevel = "moderate";
    else if (avgScore >= 30) riskLevel = "high";
    else riskLevel = "critical";
  }

  const status = scores.length > 0 ? "completed" : "pending";

  const [screening] = await db
    .insert(screeningsTable)
    .values({
      ...parsed.data,
      riskLevel,
      status,
      completedAt: status === "completed" ? new Date() : undefined,
    })
    .returning();

  // Update child risk level if screening has risk
  if (riskLevel) {
    await db
      .update(childrenTable)
      .set({ riskLevel })
      .where(eq(childrenTable.id, parsed.data.childId));
  }

  // Add timeline event
  await db.insert(timelineEventsTable).values({
    childId: parsed.data.childId,
    eventType: "screening",
    title: `Screening completed: ${parsed.data.screeningType.replace(/_/g, " ")}`,
    description: riskLevel ? `Risk level assessed as ${riskLevel}` : "Screening submitted",
    occurredAt: new Date(),
  });

  return res.status(201).json({
    ...screening,
    childName: null,
    createdAt: screening.createdAt.toISOString(),
    completedAt: screening.completedAt?.toISOString() ?? null,
  });
});

// Get a screening by ID
router.get("/screenings/:id", async (req, res) => {
  const parsed = GetScreeningParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [result] = await db
    .select({
      screening: screeningsTable,
      childName: childrenTable.fullName,
    })
    .from(screeningsTable)
    .leftJoin(childrenTable, eq(screeningsTable.childId, childrenTable.id))
    .where(eq(screeningsTable.id, parsed.data.id));

  if (!result) return res.status(404).json({ error: "Not found" });

  return res.json({
    ...result.screening,
    childName: result.childName ?? null,
    createdAt: result.screening.createdAt.toISOString(),
    completedAt: result.screening.completedAt?.toISOString() ?? null,
  });
});

export default router;
