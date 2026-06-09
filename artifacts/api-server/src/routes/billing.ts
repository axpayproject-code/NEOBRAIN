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

const PLANS: Record<string, { name: string; priceMonthly: number; priceAnnual: number }> = {
  "free": { name: "Free", priceMonthly: 0, priceAnnual: 0 },
  "trial": { name: "14-Day Trial", priceMonthly: 0, priceAnnual: 0 },
  "starter-care": { name: "Starter Care", priceMonthly: 200, priceAnnual: 2000 },
  "care-plus": { name: "Care Plus", priceMonthly: 799, priceAnnual: 7990 },
  "care-family-pro": { name: "Care Family Pro", priceMonthly: 1999, priceAnnual: 19990 },
  "solo-practice": { name: "Solo Practice", priceMonthly: 4999, priceAnnual: 49990 },
  "small-clinic": { name: "Small Clinic", priceMonthly: 9999, priceAnnual: 99990 },
  "small-school": { name: "Small School (₱50/student/yr)", priceMonthly: 0, priceAnnual: 0 },
  "medium-school": { name: "Medium School (₱30/student/yr)", priceMonthly: 0, priceAnnual: 0 },
};

async function autoExpireTrialIfNeeded(userId: string): Promise<void> {
  const now = new Date();
  const [user] = await db
    .select({ subscriptionStatus: usersTable.subscriptionStatus, trialExpiresAt: usersTable.trialExpiresAt })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (user?.subscriptionStatus === "trial" && user.trialExpiresAt && user.trialExpiresAt < now) {
    await db
      .update(usersTable)
      .set({ subscriptionStatus: "active", subscriptionTier: "free" })
      .where(eq(usersTable.id, userId));
  }
}

// GET /billing/status — returns current subscription for the authenticated user
router.get("/billing/status", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  await autoExpireTrialIfNeeded(userId);

  const [user] = await db
    .select({
      id: usersTable.id,
      subscriptionTier: usersTable.subscriptionTier,
      subscriptionStatus: usersTable.subscriptionStatus,
      subscriptionPaidUntil: usersTable.subscriptionPaidUntil,
      subscriptionRef: usersTable.subscriptionRef,
      trialStartedAt: usersTable.trialStartedAt,
      trialExpiresAt: usersTable.trialExpiresAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) return res.status(404).json({ error: "User not found" });

  const plan = PLANS[user.subscriptionTier] ?? PLANS["free"];
  const now = new Date();
  const inTrial = user.subscriptionStatus === "trial" && !!user.trialExpiresAt && user.trialExpiresAt > now;
  const trialDaysLeft = inTrial && user.trialExpiresAt
    ? Math.max(0, Math.ceil((user.trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return res.json({
    tier: user.subscriptionTier,
    status: user.subscriptionStatus,
    paidUntil: user.subscriptionPaidUntil?.toISOString() ?? null,
    ref: user.subscriptionRef,
    planName: plan.name,
    priceMonthly: plan.priceMonthly,
    priceAnnual: plan.priceAnnual,
    trialStartedAt: user.trialStartedAt?.toISOString() ?? null,
    trialExpiresAt: user.trialExpiresAt?.toISOString() ?? null,
    inTrial,
    trialDaysLeft,
  });
});

// POST /billing/subscribe — submit a manual payment reference
router.post("/billing/subscribe", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { tier, paymentRef, billingCycle } = req.body as {
    tier: string;
    paymentRef: string;
    billingCycle?: "monthly" | "annual";
  };

  if (!tier || !PLANS[tier]) return res.status(400).json({ error: "Invalid subscription tier" });
  if (tier === "free" || tier === "trial") return res.status(400).json({ error: "Cannot subscribe to this plan" });
  if (!paymentRef || typeof paymentRef !== "string" || paymentRef.trim().length < 4) {
    return res.status(400).json({ error: "Valid payment reference is required" });
  }

  const now = new Date();
  const cycle = billingCycle === "annual" ? "annual" : "monthly";
  const paidUntil = new Date(now);
  if (cycle === "annual") {
    paidUntil.setFullYear(paidUntil.getFullYear() + 1);
  } else {
    paidUntil.setMonth(paidUntil.getMonth() + 1);
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: "pending_verification",
      subscriptionRef: paymentRef.trim(),
      subscriptionPaidUntil: paidUntil,
    })
    .where(eq(usersTable.id, userId))
    .returning({
      subscriptionTier: usersTable.subscriptionTier,
      subscriptionStatus: usersTable.subscriptionStatus,
      subscriptionPaidUntil: usersTable.subscriptionPaidUntil,
      subscriptionRef: usersTable.subscriptionRef,
    });

  if (!updated) return res.status(404).json({ error: "User not found" });

  const [userInfo] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId));
  if (userInfo) {
    const { sendEmail: se, paymentSubmittedEmail: pse } = await import("../lib/email");
    se(pse(userInfo.name, userInfo.email, PLANS[tier]?.name ?? tier, paymentRef.trim())).catch(() => {});
  }

  return res.json({
    success: true,
    tier: updated.subscriptionTier,
    status: updated.subscriptionStatus,
    paidUntil: updated.subscriptionPaidUntil?.toISOString() ?? null,
    ref: updated.subscriptionRef,
    message: "Payment reference received. Your plan will be activated within 24 hours after verification.",
  });
});

// POST /billing/activate — admin: approve a pending subscription
router.post("/billing/activate", async (req, res) => {
  const adminId = getUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });

  const [admin] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, adminId));
  if (!admin || (admin.role !== "government" && admin.role !== "superadmin")) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { targetUserId } = req.body as { targetUserId: string };
  if (!targetUserId) return res.status(400).json({ error: "targetUserId required" });

  const [updated] = await db
    .update(usersTable)
    .set({ subscriptionStatus: "active" })
    .where(eq(usersTable.id, targetUserId))
    .returning({ subscriptionTier: usersTable.subscriptionTier, subscriptionStatus: usersTable.subscriptionStatus });

  if (!updated) return res.status(404).json({ error: "User not found" });
  return res.json({ success: true, ...updated });
});

// POST /billing/suspend — admin: suspend a user's subscription
router.post("/billing/suspend", async (req, res) => {
  const adminId = getUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });

  const [admin] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, adminId));
  if (!admin || (admin.role !== "government" && admin.role !== "superadmin")) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { targetUserId } = req.body as { targetUserId: string };
  if (!targetUserId) return res.status(400).json({ error: "targetUserId required" });

  const [updated] = await db
    .update(usersTable)
    .set({ subscriptionStatus: "suspended" })
    .where(eq(usersTable.id, targetUserId))
    .returning({ subscriptionTier: usersTable.subscriptionTier, subscriptionStatus: usersTable.subscriptionStatus });

  if (!updated) return res.status(404).json({ error: "User not found" });
  return res.json({ success: true, ...updated });
});

// POST /billing/downgrade — admin: downgrade a user to free
router.post("/billing/downgrade", async (req, res) => {
  const adminId = getUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });

  const [admin] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, adminId));
  if (!admin || (admin.role !== "government" && admin.role !== "superadmin")) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { targetUserId } = req.body as { targetUserId: string };
  if (!targetUserId) return res.status(400).json({ error: "targetUserId required" });

  const [updated] = await db
    .update(usersTable)
    .set({ subscriptionStatus: "active", subscriptionTier: "free", subscriptionRef: null, subscriptionPaidUntil: null })
    .where(eq(usersTable.id, targetUserId))
    .returning({ subscriptionTier: usersTable.subscriptionTier, subscriptionStatus: usersTable.subscriptionStatus });

  if (!updated) return res.status(404).json({ error: "User not found" });
  return res.json({ success: true, ...updated });
});

// DELETE /billing/users/:id — admin: delete a user
router.delete("/billing/users/:id", async (req, res) => {
  const adminId = getUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });

  const [admin] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, adminId));
  if (!admin || (admin.role !== "government" && admin.role !== "superadmin")) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "User ID required" });

  const deleted = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
  if (!deleted.length) return res.status(404).json({ error: "User not found" });
  return res.json({ success: true, deleted: deleted[0].id });
});

// GET /billing/users — admin: list all users with subscription info
router.get("/billing/users", async (req, res) => {
  const adminId = getUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });

  const [admin] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, adminId));
  if (!admin || (admin.role !== "government" && admin.role !== "superadmin")) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      phone: usersTable.phone,
      orgName: usersTable.orgName,
      region: usersTable.region,
      subscriptionTier: usersTable.subscriptionTier,
      subscriptionStatus: usersTable.subscriptionStatus,
      subscriptionPaidUntil: usersTable.subscriptionPaidUntil,
      subscriptionRef: usersTable.subscriptionRef,
      trialStartedAt: usersTable.trialStartedAt,
      trialExpiresAt: usersTable.trialExpiresAt,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(ne(usersTable.role, "superadmin"))
    .orderBy(usersTable.createdAt);

  const now = new Date();
  return res.json(
    rows.map(u => {
      const inTrial = u.subscriptionStatus === "trial" && !!u.trialExpiresAt && u.trialExpiresAt > now;
      const trialDaysLeft = inTrial && u.trialExpiresAt
        ? Math.max(0, Math.ceil((u.trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      return {
        ...u,
        subscriptionPaidUntil: u.subscriptionPaidUntil?.toISOString() ?? null,
        trialStartedAt: u.trialStartedAt?.toISOString() ?? null,
        trialExpiresAt: u.trialExpiresAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        inTrial,
        trialDaysLeft,
      };
    })
  );
});

// GET /users/directory — list users for collaboration (all roles)
router.get("/users/directory", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      role: usersTable.role,
      orgName: usersTable.orgName,
      region: usersTable.region,
    })
    .from(usersTable)
    .where(ne(usersTable.id, userId));

  return res.json(rows);
});

export default router;
