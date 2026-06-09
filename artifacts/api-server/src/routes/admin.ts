import { Router } from "express";
import { db, usersTable, childrenTable, screeningsTable, brainGymActivitiesTable, auditLogsTable, appointmentsTable, therapyPlansTable } from "@workspace/db";
import { eq, desc, asc, and, inArray, sql } from "drizzle-orm";

const router = Router();

const getUserId = (req: any): string | null => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

async function requireSuperAdmin(req: any, res: any, next: any) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const [user] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.role !== "superadmin") return res.status(403).json({ error: "Super admin access required" });
  (req as any).adminId = userId;
  next();
}

async function logAdminAction(adminId: string, action: string, resourceType: string, resourceId?: string, oldValues?: object, newValues?: object) {
  try {
    await db.insert(auditLogsTable).values({
      userId: adminId, action, resourceType, resourceId: resourceId ?? null,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      outcome: "success",
    });
  } catch {}
}

// ── Users ──────────────────────────────────────────────────────────────────
router.get("/admin/users", requireSuperAdmin, async (req, res) => {
  const users = await db.select({
    id: usersTable.id, email: usersTable.email, name: usersTable.name,
    role: usersTable.role, phone: usersTable.phone, orgName: usersTable.orgName,
    region: usersTable.region, subscriptionTier: usersTable.subscriptionTier,
    subscriptionStatus: usersTable.subscriptionStatus,
    subscriptionPaidUntil: usersTable.subscriptionPaidUntil,
    subscriptionRef: usersTable.subscriptionRef,
    paymentProofUrl: usersTable.paymentProofUrl,
    requestedPlan: usersTable.requestedPlan,
    requestedBillingCycle: usersTable.requestedBillingCycle,
    trialStartedAt: usersTable.trialStartedAt,
    trialExpiresAt: usersTable.trialExpiresAt,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(desc(usersTable.createdAt));

  return res.json(users.map(u => ({
    ...u,
    hasPaymentProof: !!u.paymentProofUrl,
    paymentProofUrl: undefined,
    subscriptionPaidUntil: u.subscriptionPaidUntil?.toISOString() ?? null,
    trialStartedAt: u.trialStartedAt?.toISOString() ?? null,
    trialExpiresAt: u.trialExpiresAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  })));
});

// GET /admin/users/:id/payment-proof — return proof image for a specific pending user
router.get("/admin/users/:id/payment-proof", requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const [user] = await db.select({ paymentProofUrl: usersTable.paymentProofUrl })
    .from(usersTable).where(eq(usersTable.id, id));
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!user.paymentProofUrl) return res.status(404).json({ error: "No proof on file" });
  return res.json({ proof: user.paymentProofUrl });
});

router.put("/admin/users/:id", requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, role, phone, orgName, region, subscriptionTier, subscriptionStatus } = req.body;
  const [before] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!before) return res.status(404).json({ error: "User not found" });

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (email) updates.email = email.toLowerCase();
  if (role) updates.role = role;
  if (phone !== undefined) updates.phone = phone || null;
  if (orgName !== undefined) updates.orgName = orgName || null;
  if (region !== undefined) updates.region = region || null;
  if (subscriptionTier) updates.subscriptionTier = subscriptionTier;
  if (subscriptionStatus) updates.subscriptionStatus = subscriptionStatus;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning({
    id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role,
    subscriptionTier: usersTable.subscriptionTier, subscriptionStatus: usersTable.subscriptionStatus,
    phone: usersTable.phone, orgName: usersTable.orgName, region: usersTable.region,
  });
  await logAdminAction((req as any).adminId, "update_user", "user", id, { name: before.name, role: before.role }, updates);
  return res.json(updated);
});

router.delete("/admin/users/:id", requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const [before] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, id));
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
  if (!deleted) return res.status(404).json({ error: "User not found" });
  await logAdminAction((req as any).adminId, "delete_user", "user", id, before ?? {});
  return res.json({ success: true });
});

// ── Children ───────────────────────────────────────────────────────────────
router.get("/admin/children", requireSuperAdmin, async (req, res) => {
  const rows = await db.select({
    id: childrenTable.id, userId: childrenTable.userId,
    fullName: childrenTable.fullName, dateOfBirth: childrenTable.dateOfBirth,
    gender: childrenTable.gender, riskLevel: childrenTable.riskLevel,
    diagnosisNotes: childrenTable.diagnosisNotes, parentName: childrenTable.parentName,
    parentEmail: childrenTable.parentEmail, schoolName: childrenTable.schoolName,
    createdAt: childrenTable.createdAt,
  }).from(childrenTable).orderBy(desc(childrenTable.createdAt));
  return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.put("/admin/children/:id", requireSuperAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { fullName, dateOfBirth, gender, riskLevel, diagnosisNotes, parentName, parentEmail, schoolName } = req.body;
  const updates: Record<string, unknown> = {};
  if (fullName) updates.fullName = fullName;
  if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
  if (gender) updates.gender = gender;
  if (riskLevel) updates.riskLevel = riskLevel;
  if (diagnosisNotes !== undefined) updates.diagnosisNotes = diagnosisNotes;
  if (parentName !== undefined) updates.parentName = parentName;
  if (parentEmail !== undefined) updates.parentEmail = parentEmail;
  if (schoolName !== undefined) updates.schoolName = schoolName;
  const [updated] = await db.update(childrenTable).set(updates).where(eq(childrenTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Child not found" });
  await logAdminAction((req as any).adminId, "update_child", "child", String(id), {}, updates);
  return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/admin/children/:id", requireSuperAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(childrenTable).where(eq(childrenTable.id, id)).returning({ id: childrenTable.id });
  if (!deleted) return res.status(404).json({ error: "Child not found" });
  await logAdminAction((req as any).adminId, "delete_child", "child", String(id));
  return res.json({ success: true });
});

// ── Screenings ─────────────────────────────────────────────────────────────
router.get("/admin/screenings", requireSuperAdmin, async (req, res) => {
  const rows = await db.select({
    id: screeningsTable.id, childId: screeningsTable.childId,
    screeningType: screeningsTable.screeningType, status: screeningsTable.status,
    riskLevel: screeningsTable.riskLevel, communicationScore: screeningsTable.communicationScore,
    socialScore: screeningsTable.socialScore, attentionScore: screeningsTable.attentionScore,
    motorScore: screeningsTable.motorScore, emotionalScore: screeningsTable.emotionalScore,
    clinicalSummary: screeningsTable.clinicalSummary, referralRecommendations: screeningsTable.referralRecommendations,
    createdAt: screeningsTable.createdAt,
    childName: childrenTable.fullName, userId: childrenTable.userId,
  }).from(screeningsTable)
    .leftJoin(childrenTable, eq(screeningsTable.childId, childrenTable.id))
    .orderBy(desc(screeningsTable.createdAt)).limit(500);
  return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.put("/admin/screenings/:id", requireSuperAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { riskLevel, clinicalSummary, referralRecommendations, status } = req.body;
  const updates: Record<string, unknown> = {};
  if (riskLevel) updates.riskLevel = riskLevel;
  if (clinicalSummary !== undefined) updates.clinicalSummary = clinicalSummary;
  if (referralRecommendations !== undefined) updates.referralRecommendations = referralRecommendations;
  if (status) updates.status = status;
  const [updated] = await db.update(screeningsTable).set(updates).where(eq(screeningsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Screening not found" });
  await logAdminAction((req as any).adminId, "update_screening", "screening", String(id), {}, updates);
  return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.delete("/admin/screenings/:id", requireSuperAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(screeningsTable).where(eq(screeningsTable.id, id)).returning({ id: screeningsTable.id });
  if (!deleted) return res.status(404).json({ error: "Screening not found" });
  await logAdminAction((req as any).adminId, "delete_screening", "screening", String(id));
  return res.json({ success: true });
});

// ── Brain Gym Activities ───────────────────────────────────────────────────
router.get("/admin/brain-gym/activities", requireSuperAdmin, async (_req, res) => {
  const rows = await db.select().from(brainGymActivitiesTable).orderBy(brainGymActivitiesTable.domain, brainGymActivitiesTable.name);
  return res.json(rows);
});

router.post("/admin/brain-gym/activities", requireSuperAdmin, async (req, res) => {
  const { name, category, description, minAgeMonths, maxAgeMonths, durationMinutes, difficulty, domain, iconEmoji, instructions } = req.body;
  if (!name || !category || !description || !domain) return res.status(400).json({ error: "name, category, description, domain are required" });
  const [created] = await db.insert(brainGymActivitiesTable).values({
    name, category, description,
    minAgeMonths: minAgeMonths ?? 12, maxAgeMonths: maxAgeMonths ?? 144,
    durationMinutes: durationMinutes ?? 10, difficulty: difficulty ?? "medium",
    domain, iconEmoji: iconEmoji ?? "🧠", instructions: instructions ?? null, isActive: true,
  }).returning();
  await logAdminAction((req as any).adminId, "create_brain_gym_activity", "brain_gym_activity", String(created.id), {}, { name, domain });
  return res.status(201).json(created);
});

router.put("/admin/brain-gym/activities/:id", requireSuperAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, category, description, minAgeMonths, maxAgeMonths, durationMinutes, difficulty, domain, iconEmoji, instructions, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (category !== undefined) updates.category = category;
  if (description !== undefined) updates.description = description;
  if (minAgeMonths !== undefined) updates.minAgeMonths = minAgeMonths;
  if (maxAgeMonths !== undefined) updates.maxAgeMonths = maxAgeMonths;
  if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;
  if (difficulty !== undefined) updates.difficulty = difficulty;
  if (domain !== undefined) updates.domain = domain;
  if (iconEmoji !== undefined) updates.iconEmoji = iconEmoji;
  if (instructions !== undefined) updates.instructions = instructions;
  if (isActive !== undefined) updates.isActive = isActive;
  const [updated] = await db.update(brainGymActivitiesTable).set(updates).where(eq(brainGymActivitiesTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Activity not found" });
  await logAdminAction((req as any).adminId, "update_brain_gym_activity", "brain_gym_activity", String(id), {}, updates);
  return res.json(updated);
});

router.delete("/admin/brain-gym/activities/:id", requireSuperAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const [deleted] = await db.delete(brainGymActivitiesTable).where(eq(brainGymActivitiesTable.id, id)).returning({ id: brainGymActivitiesTable.id });
  if (!deleted) return res.status(404).json({ error: "Activity not found" });
  await logAdminAction((req as any).adminId, "delete_brain_gym_activity", "brain_gym_activity", String(id));
  return res.json({ success: true });
});

// ── Organizations ──────────────────────────────────────────────────────────
router.get("/admin/organizations", requireSuperAdmin, async (req, res) => {
  const role = req.query.role as string | undefined;
  const targetRoles = role ? [role] : ["school", "clinic", "government"];
  const rows = await db.select({
    id: usersTable.id, name: usersTable.name, email: usersTable.email,
    role: usersTable.role, orgName: usersTable.orgName, region: usersTable.region,
    phone: usersTable.phone, subscriptionTier: usersTable.subscriptionTier,
    subscriptionStatus: usersTable.subscriptionStatus, createdAt: usersTable.createdAt,
  }).from(usersTable)
    .where(inArray(usersTable.role, targetRoles as string[]))
    .orderBy(usersTable.role, usersTable.name);
  return res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

// ── Audit Logs ─────────────────────────────────────────────────────────────
router.get("/admin/audit-logs", requireSuperAdmin, async (req, res) => {
  const resourceType = req.query.resourceType as string | undefined;
  const action = req.query.action as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 200), 1000);

  const conditions = [];
  if (resourceType) conditions.push(eq(auditLogsTable.resourceType, resourceType));
  if (action) conditions.push(eq(auditLogsTable.action, action));

  const rows = conditions.length
    ? await db.select().from(auditLogsTable).where(and(...conditions)).orderBy(desc(auditLogsTable.occurredAt)).limit(limit)
    : await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.occurredAt)).limit(limit);

  return res.json(rows.map(r => ({ ...r, occurredAt: r.occurredAt.toISOString() })));
});

// ── Analytics ──────────────────────────────────────────────────────────────
router.get("/admin/analytics", requireSuperAdmin, async (_req, res) => {
  const [totals] = await db.select({
    users: sql<number>`count(distinct ${usersTable.id})::int`,
    children: sql<number>`count(distinct ${childrenTable.id})::int`,
    screenings: sql<number>`count(distinct ${screeningsTable.id})::int`,
  }).from(usersTable)
    .fullJoin(childrenTable, sql`true`)
    .fullJoin(screeningsTable, sql`true`);

  const allUsers = await db.select({ role: usersTable.role, subscriptionTier: usersTable.subscriptionTier, subscriptionStatus: usersTable.subscriptionStatus, region: usersTable.region }).from(usersTable);
  const byRole: Record<string, number> = {};
  const byTier: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byRegion: Record<string, number> = {};
  for (const u of allUsers) {
    byRole[u.role] = (byRole[u.role] ?? 0) + 1;
    const tier = u.subscriptionTier ?? "free";
    byTier[tier] = (byTier[tier] ?? 0) + 1;
    const st = u.subscriptionStatus ?? "inactive";
    byStatus[st] = (byStatus[st] ?? 0) + 1;
    if (u.region) byRegion[u.region] = (byRegion[u.region] ?? 0) + 1;
  }

  const allChildren = await db.select({ riskLevel: childrenTable.riskLevel }).from(childrenTable);
  const byRisk: Record<string, number> = {};
  for (const c of allChildren) {
    const r = c.riskLevel ?? "unknown";
    byRisk[r] = (byRisk[r] ?? 0) + 1;
  }

  const recentScreenings = await db.select({ screeningType: screeningsTable.screeningType, riskLevel: screeningsTable.riskLevel })
    .from(screeningsTable).orderBy(desc(screeningsTable.createdAt)).limit(500);
  const byScreeningType: Record<string, number> = {};
  const byScreeningRisk: Record<string, number> = {};
  for (const s of recentScreenings) {
    const t = s.screeningType ?? "unknown";
    byScreeningType[t] = (byScreeningType[t] ?? 0) + 1;
    if (s.riskLevel) byScreeningRisk[s.riskLevel] = (byScreeningRisk[s.riskLevel] ?? 0) + 1;
  }

  return res.json({
    totals: {
      users: allUsers.length,
      children: allChildren.length,
      screenings: recentScreenings.length,
    },
    usersByRole: byRole,
    usersByTier: byTier,
    usersByStatus: byStatus,
    usersByRegion: byRegion,
    childrenByRisk: byRisk,
    screeningsByType: byScreeningType,
    screeningsByRisk: byScreeningRisk,
  });
});

// ── System Settings ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: Record<string, unknown> = {
  maintenanceMode: false,
  maintenanceMessage: "NEOBRAIN is undergoing scheduled maintenance. We'll be back shortly.",
  maxFreeChildren: 2,
  maxTrialDays: 14,
  platformEmail: "support@accentecx.com",
  allowNewRegistrations: true,
  requireEmailVerification: false,
  defaultRegion: "NCR",
  reportGenerationEnabled: true,
  aiInsightsEnabled: true,
  brainGymEnabled: true,
  telemedicineEnabled: true,
  maxScreeningsPerMonth: 50,
  supportPhone: "+63 2 8XXX XXXX",
  dataRetentionDays: 3650,
  autoBackupEnabled: true,
  sessionTimeoutMinutes: 480,
};

const settingsStore: Record<string, unknown> = { ...DEFAULT_SETTINGS };

router.get("/admin/system-settings", requireSuperAdmin, (_req, res) => res.json(settingsStore));

router.put("/admin/system-settings", requireSuperAdmin, async (req, res) => {
  const updates = req.body as Record<string, unknown>;
  const allowed = new Set(Object.keys(DEFAULT_SETTINGS));
  for (const key of Object.keys(updates)) {
    if (allowed.has(key)) settingsStore[key] = updates[key];
  }
  await logAdminAction((req as any).adminId, "update_system_settings", "system_settings", undefined, {}, updates);
  return res.json(settingsStore);
});

// GET /admin/users/:id/family-details — deep profile for family-role users
router.get("/admin/users/:id/family-details", requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!u) return res.status(404).json({ error: "User not found" });

  const children = await db.select().from(childrenTable).where(eq(childrenTable.userId, id)).orderBy(asc(childrenTable.createdAt));

  const childDetails = await Promise.all(children.map(async child => {
    const screenings = await db.select({
      id: screeningsTable.id, screeningType: screeningsTable.screeningType,
      status: screeningsTable.status, riskLevel: screeningsTable.riskLevel,
      createdAt: screeningsTable.createdAt,
    }).from(screeningsTable).where(eq(screeningsTable.childId, child.id)).orderBy(desc(screeningsTable.createdAt));

    const appts = await db.select({
      id: appointmentsTable.id, specialistType: appointmentsTable.specialistType,
      status: appointmentsTable.status, scheduledAt: appointmentsTable.scheduledAt,
    }).from(appointmentsTable).where(eq(appointmentsTable.childId, child.id)).orderBy(desc(appointmentsTable.scheduledAt));

    const plans = await db.select({
      id: therapyPlansTable.id, therapyType: therapyPlansTable.therapyType,
      status: therapyPlansTable.status, title: therapyPlansTable.title,
      startDate: therapyPlansTable.startDate,
    }).from(therapyPlansTable).where(eq(therapyPlansTable.childId, child.id));

    return { ...child, screenings, appointments: appts, therapyPlans: plans };
  }));

  return res.json({
    user: {
      id: u.id, name: u.name, email: u.email, phone: u.phone, region: u.region,
      subscriptionTier: u.subscriptionTier, subscriptionStatus: u.subscriptionStatus,
      trialExpiresAt: u.trialExpiresAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    },
    children: childDetails,
    summary: {
      totalChildren: children.length,
      totalScreenings: childDetails.reduce((s, c) => s + c.screenings.length, 0),
      totalAppointments: childDetails.reduce((s, c) => s + c.appointments.length, 0),
      totalTherapyPlans: childDetails.reduce((s, c) => s + c.therapyPlans.length, 0),
      riskBreakdown: {
        critical: children.filter(c => c.riskLevel === "critical").length,
        high:     children.filter(c => c.riskLevel === "high").length,
        moderate: children.filter(c => c.riskLevel === "moderate").length,
        low:      children.filter(c => c.riskLevel === "low").length,
        unknown:  children.filter(c => !c.riskLevel || c.riskLevel === "unknown").length,
      },
    },
  });
});

// ── Appointment Payment Management ────────────────────────────────────────────

// GET /admin/appointments/pending-payment — list appointments awaiting payment verification
router.get("/admin/appointments/pending-payment", requireSuperAdmin, async (req, res) => {
  const rows = await db
    .select({
      appointment: appointmentsTable,
      childName: childrenTable.fullName,
      userId: childrenTable.userId,
    })
    .from(appointmentsTable)
    .leftJoin(childrenTable, eq(appointmentsTable.childId, childrenTable.id))
    .where(eq(appointmentsTable.paymentStatus, "pending_verification"))
    .orderBy(desc(appointmentsTable.createdAt));

  // Fetch parent name/email for each
  const userIds = [...new Set(rows.map(r => r.userId).filter(Boolean))] as string[];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
        .from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  return res.json(rows.map(r => ({
    ...r.appointment,
    scheduledAt: r.appointment.scheduledAt.toISOString(),
    createdAt: r.appointment.createdAt.toISOString(),
    childName: r.childName ?? null,
    hasPaymentProof: !!r.appointment.paymentProofUrl,
    paymentProofUrl: undefined,
    parentName: r.userId ? (userMap[r.userId]?.name ?? null) : null,
    parentEmail: r.userId ? (userMap[r.userId]?.email ?? null) : null,
  })));
});

// GET /admin/appointments/:id/payment-proof — return proof image for a specific appointment
router.get("/admin/appointments/:id/payment-proof", requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const [appt] = await db.select({ paymentProofUrl: appointmentsTable.paymentProofUrl })
    .from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  if (!appt.paymentProofUrl) return res.status(404).json({ error: "No proof on file" });
  return res.json({ proof: appt.paymentProofUrl });
});

// POST /admin/appointments/:id/approve-payment — admin confirms payment, marks appointment active
router.post("/admin/appointments/:id/approve-payment", requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  const [updated] = await db.update(appointmentsTable).set({
    paymentStatus: "paid",
    paymentProofUrl: null,
    status: "scheduled",
  }).where(eq(appointmentsTable.id, id)).returning();

  // Notify family
  const [child] = await db.select({ userId: childrenTable.userId }).from(childrenTable).where(eq(childrenTable.id, appt.childId));
  if (child?.userId) {
    const [u] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, child.userId));
    if (u) {
      const { sendEmail: se, notificationEmail: ne } = await import("../lib/email");
      se(ne(
        u.name, u.email,
        "Appointment Confirmed — Payment Verified",
        `Your payment for your appointment with ${appt.specialistName} on ${appt.scheduledAt.toLocaleDateString("en-PH")} has been verified. Your booking is now confirmed. The specialist will send you the session details shortly.`,
      )).catch(() => {});
    }
  }

  return res.json({ success: true, paymentStatus: updated.paymentStatus, status: updated.status });
});

// POST /admin/appointments/:id/reject-payment — admin rejects, resets to unpaid
router.post("/admin/appointments/:id/reject-payment", requireSuperAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { reason } = req.body as { reason?: string };

  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  await db.update(appointmentsTable).set({
    paymentStatus: "unpaid",
    paymentRef: null,
    paymentProofUrl: null,
  }).where(eq(appointmentsTable.id, id));

  // Notify family
  const [child] = await db.select({ userId: childrenTable.userId }).from(childrenTable).where(eq(childrenTable.id, appt.childId));
  if (child?.userId) {
    const [u] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, child.userId));
    if (u) {
      const { sendEmail: se, notificationEmail: ne } = await import("../lib/email");
      se(ne(
        u.name, u.email,
        "Appointment Payment Verification Unsuccessful",
        `We were unable to verify your payment for your appointment with ${appt.specialistName}${reason ? `: ${reason}` : ". The reference or proof provided could not be confirmed."}  Please resubmit your payment proof or contact us at info@accentecxai.com.`,
      )).catch(() => {});
    }
  }

  return res.json({ success: true, message: "Payment rejected. Appointment reset to unpaid." });
});

// ── Organisation Account Activation ──────────────────────────────────────────

// GET /admin/orgs/pending — list clinic/school/gov accounts pending admin activation
router.get("/admin/orgs/pending", requireSuperAdmin, async (_req, res) => {
  const orgs = await db
    .select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      role: usersTable.role, orgName: usersTable.orgName, region: usersTable.region,
      phone: usersTable.phone, subscriptionStatus: usersTable.subscriptionStatus,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.subscriptionStatus, "pending_org_activation"))
    .orderBy(desc(usersTable.createdAt));

  return res.json(orgs.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

// POST /admin/orgs/:id/activate — approve and activate an org account
router.post("/admin/orgs/:id/activate", requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const [u] = await db.select({ name: usersTable.name, email: usersTable.email, role: usersTable.role })
    .from(usersTable).where(eq(usersTable.id, id));
  if (!u) return res.status(404).json({ error: "User not found" });

  await db.update(usersTable)
    .set({ subscriptionStatus: "active" })
    .where(eq(usersTable.id, id));

  // Notify the org
  const { sendEmail: se, notificationEmail: ne } = await import("../lib/email");
  se(ne(
    u.name, u.email,
    "Your NEOBRAIN Account Has Been Activated",
    `Welcome to NEOBRAIN! Your ${u.role} account has been reviewed and activated by our team. You can now log in and access your full dashboard at neobrain.app.`,
  )).catch(() => {});

  return res.json({ success: true, message: `${u.name}'s account activated.` });
});

// POST /admin/orgs/:id/reject — reject an org account registration
router.post("/admin/orgs/:id/reject", requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body as { reason?: string };

  const [u] = await db.select({ name: usersTable.name, email: usersTable.email, role: usersTable.role })
    .from(usersTable).where(eq(usersTable.id, id));
  if (!u) return res.status(404).json({ error: "User not found" });

  // Delete the account so they can re-register if needed
  await db.delete(usersTable).where(eq(usersTable.id, id));

  const { sendEmail: se, notificationEmail: ne } = await import("../lib/email");
  se(ne(
    u.name, u.email,
    "NEOBRAIN Account Registration Update",
    `Thank you for your interest in NEOBRAIN. Unfortunately, we were unable to approve your ${u.role} account registration at this time${reason ? `: ${reason}` : ". Please contact us at info@accentecxai.com for more information"}.`,
  )).catch(() => {});

  return res.json({ success: true, message: `${u.name}'s registration rejected and removed.` });
});

export default router;
