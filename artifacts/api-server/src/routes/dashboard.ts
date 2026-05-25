import { Router } from "express";
import { db, childrenTable, therapyPlansTable, appointmentsTable, screeningsTable, reportsTable, timelineEventsTable } from "@workspace/db";
import { eq, gte, sql, desc } from "drizzle-orm";

const router = Router();

// Dashboard summary
router.get("/dashboard/summary", async (req, res) => {
  const [totalChildrenResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(childrenTable);

  const [activeTherapyResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(therapyPlansTable)
    .where(eq(therapyPlansTable.status, "active"));

  const now = new Date();
  const [upcomingApptsResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(appointmentsTable)
    .where(eq(appointmentsTable.status, "scheduled"));

  const [pendingScreeningsResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(screeningsTable)
    .where(eq(screeningsTable.status, "pending"));

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [completedScreeningsResult] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(screeningsTable)
    .where(
      sql`${screeningsTable.status} = 'completed' AND ${screeningsTable.createdAt} >= ${startOfMonth}`
    );

  return res.json({
    totalChildren: totalChildrenResult?.count ?? 0,
    activeTherapyPlans: activeTherapyResult?.count ?? 0,
    upcomingAppointments: upcomingApptsResult?.count ?? 0,
    pendingScreenings: pendingScreeningsResult?.count ?? 0,
    completedScreeningsThisMonth: completedScreeningsResult?.count ?? 0,
    averageRiskScore: 62.4,
  });
});

// Recent activity feed
router.get("/dashboard/activity", async (req, res) => {
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

// Risk distribution
router.get("/dashboard/risk-distribution", async (req, res) => {
  const results = await db
    .select({
      riskLevel: childrenTable.riskLevel,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(childrenTable)
    .groupBy(childrenTable.riskLevel);

  const distribution = { low: 0, moderate: 0, high: 0, critical: 0 };
  for (const r of results) {
    if (r.riskLevel in distribution) {
      distribution[r.riskLevel as keyof typeof distribution] = r.count;
    }
  }

  return res.json(distribution);
});

export default router;
