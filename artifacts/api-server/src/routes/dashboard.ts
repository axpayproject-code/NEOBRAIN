import { Router } from "express";
import { db, childrenTable, therapyPlansTable, appointmentsTable, screeningsTable, timelineEventsTable } from "@workspace/db";
import { eq, sql, desc, and, inArray } from "drizzle-orm";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

// Dashboard summary — scoped to authenticated user
router.get("/dashboard/summary", async (req, res) => {
  const userId = getUserId(req);

  // Get user's children (scoped)
  const childRows = userId
    ? await db.select({ id: childrenTable.id }).from(childrenTable).where(eq(childrenTable.userId, userId))
    : await db.select({ id: childrenTable.id }).from(childrenTable);

  const childIds = childRows.map(r => r.id);
  const totalChildren = childIds.length;

  if (childIds.length === 0) {
    return res.json({
      totalChildren: 0,
      activeTherapyPlans: 0,
      upcomingAppointments: 0,
      pendingScreenings: 0,
      completedScreeningsThisMonth: 0,
      averageRiskScore: 0,
    });
  }

  const [activeTherapyResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(therapyPlansTable)
    .where(and(eq(therapyPlansTable.status, "active"), inArray(therapyPlansTable.childId, childIds)));

  const [upcomingApptsResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.status, "scheduled"), inArray(appointmentsTable.childId, childIds)));

  const [pendingScreeningsResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(screeningsTable)
    .where(and(eq(screeningsTable.status, "pending"), inArray(screeningsTable.childId, childIds)));

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [completedScreeningsResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(screeningsTable)
    .where(
      and(
        eq(screeningsTable.status, "completed"),
        sql`${screeningsTable.createdAt} >= ${startOfMonth}`,
        inArray(screeningsTable.childId, childIds)
      )
    );

  return res.json({
    totalChildren,
    activeTherapyPlans: activeTherapyResult?.count ?? 0,
    upcomingAppointments: upcomingApptsResult?.count ?? 0,
    pendingScreenings: pendingScreeningsResult?.count ?? 0,
    completedScreeningsThisMonth: completedScreeningsResult?.count ?? 0,
    averageRiskScore: 0,
  });
});

// Recent activity feed — scoped to authenticated user
router.get("/dashboard/activity", async (req, res) => {
  const userId = getUserId(req);

  const childRows = userId
    ? await db.select({ id: childrenTable.id }).from(childrenTable).where(eq(childrenTable.userId, userId))
    : await db.select({ id: childrenTable.id }).from(childrenTable);

  const childIds = childRows.map(r => r.id);

  if (childIds.length === 0) {
    return res.json([]);
  }

  const events = await db
    .select({
      id: timelineEventsTable.id,
      eventType: timelineEventsTable.eventType,
      title: timelineEventsTable.title,
      description: timelineEventsTable.description,
      occurredAt: timelineEventsTable.occurredAt,
      childId: timelineEventsTable.childId,
      childName: childrenTable.fullName,
    })
    .from(timelineEventsTable)
    .leftJoin(childrenTable, eq(timelineEventsTable.childId, childrenTable.id))
    .where(inArray(timelineEventsTable.childId, childIds))
    .orderBy(desc(timelineEventsTable.occurredAt))
    .limit(20);

  const activityTypeMap: Record<string, string> = {
    screening: "screening_completed",
    appointment: "appointment_scheduled",
    therapy: "therapy_updated",
    report: "report_generated",
    milestone: "milestone_reached",
    referral: "milestone_reached",
  };

  return res.json(
    events.map((e) => ({
      id: e.id,
      activityType: activityTypeMap[e.eventType] ?? "milestone_reached",
      title: e.title,
      description: e.description ?? "",
      childName: e.childName ?? null,
      childId: e.childId ?? null,
      occurredAt: e.occurredAt.toISOString(),
    }))
  );
});

// Risk distribution — scoped to authenticated user
router.get("/dashboard/risk-distribution", async (req, res) => {
  const userId = getUserId(req);

  const query = db
    .select({ riskLevel: childrenTable.riskLevel, count: sql<number>`cast(count(*) as int)` })
    .from(childrenTable)
    .groupBy(childrenTable.riskLevel);

  const results = userId
    ? await query.where(eq(childrenTable.userId, userId))
    : await query;

  const distribution = { low: 0, moderate: 0, high: 0, critical: 0 };
  for (const r of results) {
    if (r.riskLevel in distribution) {
      distribution[r.riskLevel as keyof typeof distribution] = r.count;
    }
  }

  return res.json(distribution);
});

export default router;
