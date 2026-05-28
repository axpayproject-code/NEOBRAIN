import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

const PLANS: Record<string, { name: string; priceMonthly: number; priceAnnual: number }> = {
  free: { name: "Free", priceMonthly: 0, priceAnnual: 0 },
  care_plus: { name: "Care Plus", priceMonthly: 499, priceAnnual: 4990 },
  clinical_pro: { name: "Clinical Pro", priceMonthly: 2999, priceAnnual: 29990 },
  institutional: { name: "Institutional", priceMonthly: 15000, priceAnnual: 150000 },
};

// GET /billing/status — returns current subscription for the authenticated user
router.get("/billing/status", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [user] = await db
    .select({
      id: usersTable.id,
      subscriptionTier: usersTable.subscriptionTier,
      subscriptionStatus: usersTable.subscriptionStatus,
      subscriptionPaidUntil: usersTable.subscriptionPaidUntil,
      subscriptionRef: usersTable.subscriptionRef,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) return res.status(404).json({ error: "User not found" });

  const plan = PLANS[user.subscriptionTier] ?? PLANS.free;

  return res.json({
    tier: user.subscriptionTier,
    status: user.subscriptionStatus,
    paidUntil: user.subscriptionPaidUntil?.toISOString() ?? null,
    ref: user.subscriptionRef,
    planName: plan.name,
    priceMonthly: plan.priceMonthly,
    priceAnnual: plan.priceAnnual,
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
  if (!paymentRef || typeof paymentRef !== "string" || paymentRef.trim().length < 4) {
    return res.status(400).json({ error: "Valid payment reference is required" });
  }

  // Calculate expiry
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

// GET /billing/users — admin: list all users with subscription info
router.get("/billing/users", async (req, res) => {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      subscriptionTier: usersTable.subscriptionTier,
      subscriptionStatus: usersTable.subscriptionStatus,
      subscriptionPaidUntil: usersTable.subscriptionPaidUntil,
      subscriptionRef: usersTable.subscriptionRef,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  return res.json(
    rows.map(u => ({
      ...u,
      subscriptionPaidUntil: u.subscriptionPaidUntil?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    }))
  );
});

export default router;
