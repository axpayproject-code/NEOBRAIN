import { startSession, endSession } from "../lib/session";
import { Router } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db, usersTable, userOnboardingTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendEmail, welcomeEmail } from "../lib/email";
const router = Router();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, storedHash] = stored.split(":");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
  } catch {
    return false;
  }
}

const VALID_ROLES = ["family", "clinic", "school", "government", "superadmin"] as const;
type Role = (typeof VALID_ROLES)[number];

function isValidRole(r: unknown): r is Role {
  return typeof r === "string" && (VALID_ROLES as readonly string[]).includes(r);
}

router.post("/auth/signup", async (req, res) => {
  const { email, name, password, role: roleRaw, orgName, region, phone } = req.body as Record<string, unknown>;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required." });
  }
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  if (roleRaw === "superadmin") return res.status(403).json({error:"Administrator accounts require provisioning"});
  const role: Role = isValidRole(roleRaw) ? roleRaw : "family";

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.trim().toLowerCase()));
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const passwordHash = hashPassword(password);

  const now = new Date();
  // Documentation is free; organization participation is verified independently.
  const needsTrial = false;
  const needsOrgApproval = false;
  const trialExpiry = needsTrial ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null;

  const [user] = await db.insert(usersTable).values({
    email: email.trim().toLowerCase(),
    name,
    role,
    passwordHash,
    subscriptionTier: "free",
    subscriptionStatus: needsTrial ? "trial" : needsOrgApproval ? "pending_org_activation" : "active",
    trialStartedAt: needsTrial ? now : null,
    trialExpiresAt: trialExpiry,
    trialUsed: needsTrial,
    orgName: typeof orgName === "string" && orgName.trim() ? orgName.trim() : null,
    region: typeof region === "string" && region.trim() ? region.trim() : null,
    phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
  }).returning({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    role: usersTable.role,
    subscriptionTier: usersTable.subscriptionTier,
    subscriptionStatus: usersTable.subscriptionStatus,
    trialExpiresAt: usersTable.trialExpiresAt,
    createdAt: usersTable.createdAt,
  });

  req.log.info({ userId: user.id, role }, "Account created; email verification required");
  sendEmail(welcomeEmail(user.name, user.email)).catch(() => {});
  await db.insert(userOnboardingTable).values({userId:user.id});
  await startSession(res, user.id);
  return res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    trialExpiresAt: user.trialExpiresAt?.toISOString() ?? null,
  });
});

router.post("/auth/login", async (req, res) => {
  const { email, password, role: roleRaw } = req.body as Record<string, unknown>;
  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const role: Role = isValidRole(roleRaw) ? roleRaw : "family";

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.trim().toLowerCase()));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const now = new Date();
  let finalStatus = user.subscriptionStatus;
  let finalTier = user.subscriptionTier;

  if (user.subscriptionStatus === "trial" && user.trialExpiresAt && user.trialExpiresAt < now) {
    await db
      .update(usersTable)
      .set({ subscriptionStatus: "active", subscriptionTier: "free" })
      .where(eq(usersTable.id, user.id));
    finalStatus = "active";
    finalTier = "free";
  }

  const inTrial = finalStatus === "trial" && !!user.trialExpiresAt && user.trialExpiresAt > now;
  const trialDaysLeft = inTrial && user.trialExpiresAt
    ? Math.max(0, Math.ceil((user.trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  req.log.info({ userId: user.id }, "User logged in");
  await startSession(res, user.id);
  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscriptionTier: finalTier,
    subscriptionStatus: finalStatus,
    trialExpiresAt: user.trialExpiresAt?.toISOString() ?? null,
    inTrial,
    trialDaysLeft,
  });
});

// PATCH /auth/profile — update user profile fields
router.patch("/auth/profile", async (req, res) => {
  const auth = req.headers.authorization;
  const userId = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { name, orgName, region, phone } = req.body as Record<string, unknown>;

  const updates: Partial<{ name: string; orgName: string | null; region: string | null; phone: string | null }> = {};
  if (typeof name === "string" && name.trim()) updates.name = name.trim();
  if (typeof orgName === "string") updates.orgName = orgName.trim() || null;
  if (typeof region === "string") updates.region = region.trim() || null;
  if (typeof phone === "string") updates.phone = phone.trim() || null;

  if (!Object.keys(updates).length) return res.status(400).json({ error: "No valid fields to update" });

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning({ id: usersTable.id, name: usersTable.name, orgName: usersTable.orgName, region: usersTable.region, phone: usersTable.phone });

  if (!updated) return res.status(404).json({ error: "User not found" });
  return res.json({ success: true, ...updated });
});

router.get("/auth/me", (req,res) => { const {passwordHash,...user}=res.locals.user; return res.json(user); });
router.post("/auth/logout", async(req,res)=>{await endSession(req,res);res.status(204).end();});
export default router;
