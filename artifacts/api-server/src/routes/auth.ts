import { Router } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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
  const { email, name, password, role: roleRaw } = req.body as Record<string, unknown>;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required." });
  }
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const role: Role = isValidRole(roleRaw) ? roleRaw : "family";

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    name,
    role,
    passwordHash,
  }).returning({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    role: usersTable.role,
    subscriptionTier: usersTable.subscriptionTier,
    subscriptionStatus: usersTable.subscriptionStatus,
    createdAt: usersTable.createdAt,
  });

  req.log.info({ userId: user.id }, "User created");
  return res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
  });
});

router.post("/auth/login", async (req, res) => {
  const { email, password, role: roleRaw } = req.body as Record<string, unknown>;
  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const role: Role = isValidRole(roleRaw) ? roleRaw : "family";

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  req.log.info({ userId: user.id }, "User logged in");
  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: isValidRole(roleRaw) ? role : user.role,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
  });
});

export default router;
