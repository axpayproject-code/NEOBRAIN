import { Router } from "express";
import { db } from "@workspace/db";
import {
  nutritionProfilesTable,
  growthRecordsTable,
  feedingHistoryTable,
  mealLogsTable,
  foodExposuresTable,
  nutritionInsightsTable,
  timelineEventsTable,
  childrenTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

// ─── Nutrition Profile ─────────────────────────────────────────────────────────

router.get("/nutrition/profile/:childId", async (req, res) => {
  const childId = Number(req.params.childId);
  if (isNaN(childId)) return res.status(400).json({ error: "Invalid childId" });
  const [profile] = await db.select().from(nutritionProfilesTable).where(eq(nutritionProfilesTable.childId, childId)).limit(1);
  if (!profile) return res.status(404).json({ error: "No nutrition profile found" });
  return res.json({ ...profile, createdAt: profile.createdAt.toISOString(), updatedAt: profile.updatedAt?.toISOString() ?? null });
});

router.post("/nutrition/profile", async (req, res) => {
  const userId = getUserId(req);
  const { childId, feedingType, dietaryPattern, nutritionStatus, foodDiversityScore, mealConsistencyScore, hydrationTracking, notes } = req.body as Record<string, unknown>;
  if (!childId || typeof childId !== "number") return res.status(400).json({ error: "childId required" });
  const [profile] = await db.insert(nutritionProfilesTable).values({
    childId,
    feedingType: feedingType as string | undefined,
    dietaryPattern: dietaryPattern as string | undefined,
    nutritionStatus: (nutritionStatus as string | undefined) ?? "normal",
    foodDiversityScore: foodDiversityScore as number | undefined,
    mealConsistencyScore: mealConsistencyScore as number | undefined,
    hydrationTracking: hydrationTracking as string | undefined,
    notes: notes as string | undefined,
    updatedBy: userId ?? undefined,
  }).returning();
  return res.status(201).json({ ...profile, createdAt: profile.createdAt.toISOString(), updatedAt: profile.updatedAt?.toISOString() ?? null });
});

router.patch("/nutrition/profile/:childId", async (req, res) => {
  const childId = Number(req.params.childId);
  if (isNaN(childId)) return res.status(400).json({ error: "Invalid childId" });
  const userId = getUserId(req);
  const { childId: _cid, id: _id, createdAt: _ca, ...rest } = req.body as Record<string, unknown>;
  const updates = { ...rest, updatedBy: userId ?? undefined };
  const [profile] = await db.update(nutritionProfilesTable).set(updates).where(eq(nutritionProfilesTable.childId, childId)).returning();
  if (!profile) return res.status(404).json({ error: "Not found" });
  return res.json({ ...profile, createdAt: profile.createdAt.toISOString(), updatedAt: profile.updatedAt?.toISOString() ?? null });
});

// ─── Growth Records ────────────────────────────────────────────────────────────

router.get("/nutrition/growth/:childId", async (req, res) => {
  const childId = Number(req.params.childId);
  if (isNaN(childId)) return res.status(400).json({ error: "Invalid childId" });
  const records = await db.select().from(growthRecordsTable).where(eq(growthRecordsTable.childId, childId)).orderBy(desc(growthRecordsTable.measurementDate));
  return res.json(records.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/nutrition/growth", async (req, res) => {
  const userId = getUserId(req);
  const { childId, measurementDate, weight, height, headCircumference, bmi, source, notes } = req.body as Record<string, unknown>;
  if (!childId || !measurementDate) return res.status(400).json({ error: "childId and measurementDate required" });
  const computedBmi = bmi ?? (weight && height ? Number((Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1)) : undefined);
  const [record] = await db.insert(growthRecordsTable).values({
    childId: Number(childId),
    measurementDate: measurementDate as string,
    weight: weight ? Number(weight) : undefined,
    height: height ? Number(height) : undefined,
    headCircumference: headCircumference ? Number(headCircumference) : undefined,
    bmi: computedBmi ? Number(computedBmi) : undefined,
    source: (source as string | undefined) ?? "parent",
    recordedBy: userId ?? undefined,
    notes: notes as string | undefined,
  }).returning();
  // Timeline event
  await db.insert(timelineEventsTable).values({
    childId: Number(childId),
    eventType: "milestone",
    title: "Growth measurement recorded",
    description: weight ? `Weight: ${weight}kg${height ? `, Height: ${height}cm` : ""}` : "Growth measurement updated",
    occurredAt: new Date(),
  }).catch(() => {});
  return res.status(201).json({ ...record, createdAt: record.createdAt.toISOString() });
});

// ─── Feeding History ───────────────────────────────────────────────────────────

router.get("/nutrition/feeding/:childId", async (req, res) => {
  const childId = Number(req.params.childId);
  if (isNaN(childId)) return res.status(400).json({ error: "Invalid childId" });
  const records = await db.select().from(feedingHistoryTable).where(eq(feedingHistoryTable.childId, childId)).orderBy(desc(feedingHistoryTable.feedingTimestamp));
  return res.json(records.map(r => ({ ...r, feedingTimestamp: r.feedingTimestamp.toISOString(), createdAt: r.createdAt.toISOString() })));
});

router.post("/nutrition/feeding", async (req, res) => {
  const userId = getUserId(req);
  const { childId, feedingType, frequency, duration, amount, notes } = req.body as Record<string, unknown>;
  if (!childId || !feedingType) return res.status(400).json({ error: "childId and feedingType required" });
  const [record] = await db.insert(feedingHistoryTable).values({
    childId: Number(childId),
    feedingType: feedingType as string,
    frequency: frequency as string | undefined,
    duration: duration as string | undefined,
    amount: amount ? Number(amount) : undefined,
    notes: notes as string | undefined,
    recordedBy: userId ?? undefined,
  }).returning();
  return res.status(201).json({ ...record, feedingTimestamp: record.feedingTimestamp.toISOString(), createdAt: record.createdAt.toISOString() });
});

// ─── Meal Logs ─────────────────────────────────────────────────────────────────

router.get("/nutrition/meals/:childId", async (req, res) => {
  const childId = Number(req.params.childId);
  if (isNaN(childId)) return res.status(400).json({ error: "Invalid childId" });
  const logs = await db.select().from(mealLogsTable).where(eq(mealLogsTable.childId, childId)).orderBy(desc(mealLogsTable.date), desc(mealLogsTable.createdAt));
  return res.json(logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })));
});

router.post("/nutrition/meals", async (req, res) => {
  const userId = getUserId(req);
  const { childId, date, mealType, foodsConsumed, portion, notes } = req.body as Record<string, unknown>;
  if (!childId || !date || !mealType) return res.status(400).json({ error: "childId, date, and mealType required" });
  const [log] = await db.insert(mealLogsTable).values({
    childId: Number(childId),
    date: date as string,
    mealType: mealType as string,
    foodsConsumed: foodsConsumed as string | undefined,
    portion: portion as string | undefined,
    notes: notes as string | undefined,
    recordedBy: userId ?? undefined,
  }).returning();
  return res.status(201).json({ ...log, createdAt: log.createdAt.toISOString() });
});

// ─── Food Exposures ────────────────────────────────────────────────────────────

router.get("/nutrition/food-exposures/:childId", async (req, res) => {
  const childId = Number(req.params.childId);
  if (isNaN(childId)) return res.status(400).json({ error: "Invalid childId" });
  const records = await db.select().from(foodExposuresTable).where(eq(foodExposuresTable.childId, childId)).orderBy(desc(foodExposuresTable.firstIntroduced));
  return res.json(records.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/nutrition/food-exposures", async (req, res) => {
  const userId = getUserId(req);
  const { childId, foodItem, foodCategory, firstIntroduced, reactions, accepted, notes } = req.body as Record<string, unknown>;
  if (!childId || !foodItem || !firstIntroduced) return res.status(400).json({ error: "childId, foodItem, firstIntroduced required" });
  const [record] = await db.insert(foodExposuresTable).values({
    childId: Number(childId),
    foodItem: foodItem as string,
    foodCategory: foodCategory as string | undefined,
    firstIntroduced: firstIntroduced as string,
    reactions: reactions as string | undefined,
    accepted: (accepted as string | undefined) ?? "yes",
    notes: notes as string | undefined,
    recordedBy: userId ?? undefined,
  }).returning();
  // Timeline event for new food introduction
  await db.insert(timelineEventsTable).values({
    childId: Number(childId),
    eventType: "milestone",
    title: "New food introduced",
    description: `${foodItem} (${foodCategory ?? "uncategorized"}) was introduced`,
    occurredAt: new Date(),
  }).catch(() => {});
  return res.status(201).json({ ...record, createdAt: record.createdAt.toISOString() });
});

// ─── Nutrition Insights ────────────────────────────────────────────────────────

router.get("/nutrition/insights/:childId", async (req, res) => {
  const childId = Number(req.params.childId);
  if (isNaN(childId)) return res.status(400).json({ error: "Invalid childId" });
  const insights = await db.select().from(nutritionInsightsTable).where(eq(nutritionInsightsTable.childId, childId)).orderBy(desc(nutritionInsightsTable.createdAt)).limit(20);
  return res.json(insights.map(i => ({ ...i, createdAt: i.createdAt.toISOString() })));
});

router.post("/nutrition/insights", async (req, res) => {
  const { childId, insightType, generatedInsight, generatedDate, confidenceLevel } = req.body as Record<string, unknown>;
  if (!childId || !insightType || !generatedInsight || !generatedDate) return res.status(400).json({ error: "Missing required fields" });
  const [insight] = await db.insert(nutritionInsightsTable).values({
    childId: Number(childId),
    insightType: insightType as string,
    generatedInsight: generatedInsight as string,
    generatedDate: generatedDate as string,
    confidenceLevel: (confidenceLevel as string | undefined) ?? "medium",
  }).returning();
  return res.status(201).json({ ...insight, createdAt: insight.createdAt.toISOString() });
});

// ─── Population Summary (Government) ──────────────────────────────────────────

router.get("/nutrition/population-summary", async (_req, res) => {
  const [growthCount] = await db.select({ count: sql<number>`count(distinct child_id)` }).from(growthRecordsTable);
  const [mealCount] = await db.select({ count: sql<number>`count(*)` }).from(mealLogsTable);
  const [foodCount] = await db.select({ count: sql<number>`count(*)` }).from(foodExposuresTable);
  const [insightCount] = await db.select({ count: sql<number>`count(*)` }).from(nutritionInsightsTable);
  const [childTotal] = await db.select({ count: sql<number>`count(*)` }).from(childrenTable);
  const [avgScore] = await db.select({ avg: sql<number>`coalesce(avg(food_diversity_score), 0)` }).from(nutritionProfilesTable);

  const total = Number(childTotal?.count ?? 0);
  const withGrowth = Number(growthCount?.count ?? 0);

  return res.json({
    totalChildrenWithGrowthData: withGrowth,
    totalMealsLogged: Number(mealCount?.count ?? 0),
    totalFoodExposures: Number(foodCount?.count ?? 0),
    totalInsights: Number(insightCount?.count ?? 0),
    avgFoodDiversityScore: Number(Number(avgScore?.avg ?? 0).toFixed(1)),
    growthMonitoringCoverage: total > 0 ? Math.round((withGrowth / total) * 100) : 0,
    nutritionProgramParticipation: withGrowth,
    feedingProgramEngagement: Number(mealCount?.count ?? 0),
  });
});

export default router;
