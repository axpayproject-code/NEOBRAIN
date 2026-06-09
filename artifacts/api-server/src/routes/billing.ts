import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

export const PLANS: Record<string, { name: string; priceMonthly: number; priceAnnual: number }> = {
  "free":            { name: "Free",           priceMonthly: 0,    priceAnnual: 0 },
  "trial":           { name: "14-Day Trial",    priceMonthly: 0,    priceAnnual: 0 },
  "starter-care":    { name: "Starter Care",    priceMonthly: 200,  priceAnnual: 2000 },
  "care-plus":       { name: "Care Plus",       priceMonthly: 799,  priceAnnual: 7990 },
  "care-family-pro": { name: "Care Family Pro", priceMonthly: 1999, priceAnnual: 19990 },
  "solo-practice":   { name: "Solo Practice",   priceMonthly: 4999, priceAnnual: 49990 },
  "small-clinic":    { name: "Small Clinic",    priceMonthly: 9999, priceAnnual: 99990 },
  "small-school":    { name: "Small School",    priceMonthly: 0,    priceAnnual: 0 },
  "medium-school":   { name: "Medium School",   priceMonthly: 0,    priceAnnual: 0 },
};

async function autoExpireTrialIfNeeded(userId: string): Promise<void> {
  const now = new Date();
  const [user] = await db
    .select({ subscriptionStatus: usersTable.subscriptionStatus, trialExpiresAt: usersTable.trialExpiresAt })
    .from(usersTable).where(eq(usersTable.id, userId));
  if (user?.subscriptionStatus === "trial" && user.trialExpiresAt && user.trialExpiresAt < now) {
    await db.update(usersTable).set({ subscriptionStatus: "active", subscriptionTier: "free" }).where(eq(usersTable.id, userId));
  }
}

// GET /billing/status
router.get("/billing/status", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  await autoExpireTrialIfNeeded(userId);
  const [user] = await db.select({
    id: usersTable.id,
    subscriptionTier: usersTable.subscriptionTier,
    subscriptionStatus: usersTable.subscriptionStatus,
    subscriptionPaidUntil: usersTable.subscriptionPaidUntil,
    subscriptionRef: usersTable.subscriptionRef,
    paymentProofUrl: usersTable.paymentProofUrl,
    requestedPlan: usersTable.requestedPlan,
    requestedBillingCycle: usersTable.requestedBillingCycle,
    trialStartedAt: usersTable.trialStartedAt,
    trialExpiresAt: usersTable.trialExpiresAt,
  }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return res.status(404).json({ error: "User not found" });
  const plan = PLANS[user.subscriptionTier] ?? PLANS["free"];
  const now = new Date();
  const inTrial = user.subscriptionStatus === "trial" && !!user.trialExpiresAt && user.trialExpiresAt > now;
  const trialDaysLeft = inTrial && user.trialExpiresAt
    ? Math.max(0, Math.ceil((user.trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  return res.json({
    tier: user.subscriptionTier,
    status: user.subscriptionStatus,
    paidUntil: user.subscriptionPaidUntil?.toISOString() ?? null,
    ref: user.subscriptionRef,
    hasProof: !!user.paymentProofUrl,
    requestedPlan: user.requestedPlan ?? null,
    requestedBillingCycle: user.requestedBillingCycle ?? null,
    planName: plan.name,
    priceMonthly: plan.priceMonthly,
    priceAnnual: plan.priceAnnual,
    trialStartedAt: user.trialStartedAt?.toISOString() ?? null,
    trialExpiresAt: user.trialExpiresAt?.toISOString() ?? null,
    inTrial,
    trialDaysLeft,
  });
});

// POST /billing/subscribe — family submits upgrade/plan request with payment proof photo
router.post("/billing/subscribe", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { tier, paymentRef, billingCycle, paymentProofBase64 } = req.body as {
    tier: string; paymentRef: string; billingCycle?: string; paymentProofBase64?: string;
  };
  if (!tier || !PLANS[tier]) return res.status(400).json({ error: "Invalid subscription tier." });
  if (tier === "free" || tier === "trial") return res.status(400).json({ error: "Cannot subscribe to this plan." });
  if (!paymentRef || typeof paymentRef !== "string" || paymentRef.trim().length < 4) {
    return res.status(400).json({ error: "A valid payment reference is required." });
  }
  if (!paymentProofBase64 || typeof paymentProofBase64 !== "string") {
    return res.status(400).json({ error: "A photo proof of payment is required." });
  }
  if (paymentProofBase64.length > 5_000_000) {
    return res.status(400).json({ error: "Proof image is too large. Please compress it below 3MB." });
  }
  const cycle = billingCycle === "annual" ? "annual" : "monthly";
  const now = new Date();
  const paidUntil = new Date(now);
  cycle === "annual" ? paidUntil.setFullYear(paidUntil.getFullYear() + 1) : paidUntil.setMonth(paidUntil.getMonth() + 1);

  const [updated] = await db.update(usersTable).set({
    subscriptionStatus: "pending_verification",
    subscriptionRef: paymentRef.trim(),
    subscriptionPaidUntil: paidUntil,
    paymentProofUrl: paymentProofBase64,
    requestedPlan: tier,
    requestedBillingCycle: cycle,
  }).where(eq(usersTable.id, userId)).returning({
    subscriptionTier: usersTable.subscriptionTier,
    subscriptionStatus: usersTable.subscriptionStatus,
    subscriptionRef: usersTable.subscriptionRef,
    requestedPlan: usersTable.requestedPlan,
  });
  if (!updated) return res.status(404).json({ error: "User not found" });

  const [userInfo] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId));
  if (userInfo) {
    const { sendEmail: se, paymentSubmittedEmail: pse } = await import("../lib/email");
    se(pse(userInfo.name, userInfo.email, PLANS[tier]?.name ?? tier, paymentRef.trim())).catch(() => {});
  }
  return res.json({
    success: true,
    status: updated.subscriptionStatus,
    requestedPlan: updated.requestedPlan,
    ref: updated.subscriptionRef,
    message: "Payment proof received. Your plan will be activated within 24 hours after admin verification.",
  });
});

// POST /billing/downgrade-request — family requests downgrade to free
router.post("/billing/downgrade-request", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  await db.update(usersTable).set({
    subscriptionStatus: "pending_verification",
    requestedPlan: "free",
    requestedBillingCycle: null,
    subscriptionRef: "DOWNGRADE_REQUEST",
  }).where(eq(usersTable.id, userId));
  return res.json({ success: true, message: "Downgrade request submitted. Admin will process it shortly." });
});

// POST /billing/activate — admin approves, applies requestedPlan
router.post("/billing/activate", async (req, res) => {
  const adminId = getUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });
  const [admin] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, adminId));
  if (!admin || (admin.role !== "government" && admin.role !== "superadmin")) {
    return res.status(403).json({ error: "Admin access required." });
  }
  const { targetUserId } = req.body as { targetUserId: string };
  if (!targetUserId) return res.status(400).json({ error: "targetUserId required" });

  const [target] = await db.select({
    name: usersTable.name, email: usersTable.email,
    requestedPlan: usersTable.requestedPlan,
    subscriptionTier: usersTable.subscriptionTier,
  }).from(usersTable).where(eq(usersTable.id, targetUserId));
  if (!target) return res.status(404).json({ error: "User not found" });

  const newTier = (target.requestedPlan && PLANS[target.requestedPlan]) ? target.requestedPlan : target.subscriptionTier;
  const [updated] = await db.update(usersTable).set({
    subscriptionStatus: "active",
    subscriptionTier: newTier,
    requestedPlan: null,
    requestedBillingCycle: null,
    paymentProofUrl: null,
    subscriptionRef: null,
  }).where(eq(usersTable.id, targetUserId)).returning({
    subscriptionTier: usersTable.subscriptionTier,
    subscriptionStatus: usersTable.subscriptionStatus,
  });

  const { sendEmail: se, subscriptionApprovedEmail: sae } = await import("../lib/email");
  se(sae(target.name, target.email, PLANS[newTier]?.name ?? newTier)).catch(() => {});
  return res.json({ success: true, ...updated, activatedPlan: newTier });
});

// POST /billing/reject — admin rejects payment, reverts user to free
router.post("/billing/reject", async (req, res) => {
  const adminId = getUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });
  const [admin] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, adminId));
  if (!admin || (admin.role !== "government" && admin.role !== "superadmin")) {
    return res.status(403).json({ error: "Admin access required." });
  }
  const { targetUserId, reason } = req.body as { targetUserId: string; reason?: string };
  if (!targetUserId) return res.status(400).json({ error: "targetUserId required" });

  const [target] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, targetUserId));
  if (!target) return res.status(404).json({ error: "User not found" });

  await db.update(usersTable).set({
    subscriptionStatus: "active",
    subscriptionTier: "free",
    requestedPlan: null,
    requestedBillingCycle: null,
    paymentProofUrl: null,
    subscriptionRef: null,
    subscriptionPaidUntil: null,
  }).where(eq(usersTable.id, targetUserId));

  const { sendEmail: se, notificationEmail: ne } = await import("../lib/email");
  se(ne(
    target.name, target.email,
    "Payment Verification Unsuccessful",
    `We were unable to verify your payment${reason ? `: ${reason}` : ". The reference or proof provided could not be confirmed."} Your account remains on the Free plan. Please try again or contact us at info@accentecxai.com.`,
  )).catch(() => {});
  return res.json({ success: true, message: "Rejected. User reverted to free plan." });
});

// POST /billing/suspend
router.post("/billing/suspend", async (req, res) => {
  const adminId = getUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });
  const [admin] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, adminId));
  if (!admin || (admin.role !== "government" && admin.role !== "superadmin")) {
    return res.status(403).json({ error: "Admin access required." });
  }
  const { targetUserId } = req.body as { targetUserId: string };
  if (!targetUserId) return res.status(400).json({ error: "targetUserId required" });

  const [target] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, targetUserId));
  const [updated] = await db.update(usersTable).set({ subscriptionStatus: "suspended" })
    .where(eq(usersTable.id, targetUserId))
    .returning({ subscriptionTier: usersTable.subscriptionTier, subscriptionStatus: usersTable.subscriptionStatus });
  if (!updated) return res.status(404).json({ error: "User not found" });

  if (target) {
    const { sendEmail: se, subscriptionSuspendedEmail: sse } = await import("../lib/email");
    se(sse(target.name, target.email)).catch(() => {});
  }
  return res.json({ success: true, ...updated });
});

// POST /billing/downgrade — admin force-downgrades to free
router.post("/billing/downgrade", async (req, res) => {
  const adminId = getUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });
  const [admin] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, adminId));
  if (!admin || (admin.role !== "government" && admin.role !== "superadmin")) {
    return res.status(403).json({ error: "Admin access required." });
  }
  const { targetUserId } = req.body as { targetUserId: string };
  if (!targetUserId) return res.status(400).json({ error: "targetUserId required" });

  const [updated] = await db.update(usersTable).set({
    subscriptionStatus: "active", subscriptionTier: "free",
    subscriptionRef: null, subscriptionPaidUntil: null,
    requestedPlan: null, requestedBillingCycle: null, paymentProofUrl: null,
  }).where(eq(usersTable.id, targetUserId)).returning({
    subscriptionTier: usersTable.subscriptionTier, subscriptionStatus: usersTable.subscriptionStatus,
  });
  if (!updated) return res.status(404).json({ error: "User not found" });
  return res.json({ success: true, ...updated });
});

// DELETE /billing/users/:id
router.delete("/billing/users/:id", async (req, res) => {
  const adminId = getUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });
  const [admin] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, adminId));
  if (!admin || (admin.role !== "government" && admin.role !== "superadmin")) {
    return res.status(403).json({ error: "Admin access required." });
  }
  const deleted = await db.delete(usersTable).where(eq(usersTable.id, req.params.id)).returning({ id: usersTable.id });
  if (!deleted.length) return res.status(404).json({ error: "User not found" });
  return res.json({ success: true, deleted: deleted[0].id });
});

// GET /billing/users
router.get("/billing/users", async (req, res) => {
  const adminId = getUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });
  const [admin] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, adminId));
  if (!admin || (admin.role !== "government" && admin.role !== "superadmin")) {
    return res.status(403).json({ error: "Admin access required." });
  }
  const rows = await db.select({
    id: usersTable.id, email: usersTable.email, name: usersTable.name,
    role: usersTable.role, phone: usersTable.phone, orgName: usersTable.orgName, region: usersTable.region,
    subscriptionTier: usersTable.subscriptionTier, subscriptionStatus: usersTable.subscriptionStatus,
    subscriptionPaidUntil: usersTable.subscriptionPaidUntil, subscriptionRef: usersTable.subscriptionRef,
    requestedPlan: usersTable.requestedPlan, requestedBillingCycle: usersTable.requestedBillingCycle,
    trialStartedAt: usersTable.trialStartedAt, trialExpiresAt: usersTable.trialExpiresAt, createdAt: usersTable.createdAt,
  }).from(usersTable).where(ne(usersTable.role, "superadmin")).orderBy(usersTable.createdAt);

  const now = new Date();
  return res.json(rows.map(u => {
    const inTrial = u.subscriptionStatus === "trial" && !!u.trialExpiresAt && u.trialExpiresAt > now;
    const trialDaysLeft = inTrial && u.trialExpiresAt
      ? Math.max(0, Math.ceil((u.trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    return {
      ...u,
      subscriptionPaidUntil: u.subscriptionPaidUntil?.toISOString() ?? null,
      trialStartedAt: u.trialStartedAt?.toISOString() ?? null,
      trialExpiresAt: u.trialExpiresAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      inTrial, trialDaysLeft,
    };
  }));
});

// GET /users/directory
router.get("/users/directory", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const rows = await db.select({
    id: usersTable.id, name: usersTable.name,
    role: usersTable.role, orgName: usersTable.orgName, region: usersTable.region,
  }).from(usersTable).where(ne(usersTable.id, userId));
  return res.json(rows);
});

export default router;
