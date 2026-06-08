import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, passwordResetTokensTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

const router = Router();

const hashPassword = (password: string): string => {
  const crypto = require("crypto") as typeof import("crypto");
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, stored: string): boolean => {
  const [salt, key] = stored.split(":");
  const crypto = require("crypto") as typeof import("crypto");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === key;
};

router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body as Record<string, unknown>;
  if (!email || typeof email !== "string") return res.status(400).json({ error: "Email is required" });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) {
    return res.json({ message: "If an account exists for this email, a reset link has been sent." });
  }
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.insert(passwordResetTokensTable).values({
    userId: user.id,
    email: user.email,
    token,
    expiresAt,
  });
  req.log.info({ userId: user.id, email: user.email }, "Password reset token generated");
  return res.json({
    message: "If an account exists for this email, a reset link has been sent.",
    debug_token: process.env.NODE_ENV !== "production" ? token : undefined,
  });
});

router.post("/auth/reset-password", async (req, res) => {
  const { token, password } = req.body as Record<string, unknown>;
  if (!token || typeof token !== "string") return res.status(400).json({ error: "Token is required" });
  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  const [record] = await db.select().from(passwordResetTokensTable)
    .where(and(eq(passwordResetTokensTable.token, token), eq(passwordResetTokensTable.isUsed, false)));
  if (!record) return res.status(400).json({ error: "Invalid or expired reset token" });
  if (record.expiresAt < new Date()) return res.status(400).json({ error: "Reset token has expired" });
  const passwordHash = hashPassword(password);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, record.userId));
  await db.update(passwordResetTokensTable).set({ isUsed: true, usedAt: new Date() }).where(eq(passwordResetTokensTable.token, token));
  req.log.info({ userId: record.userId }, "Password reset successful");
  return res.json({ message: "Password reset successful. You may now log in." });
});

router.post("/auth/verify-reset-token", async (req, res) => {
  const { token } = req.body as Record<string, unknown>;
  if (!token || typeof token !== "string") return res.status(400).json({ error: "Token is required" });
  const [record] = await db.select().from(passwordResetTokensTable)
    .where(and(eq(passwordResetTokensTable.token, token), eq(passwordResetTokensTable.isUsed, false)));
  if (!record || record.expiresAt < new Date()) return res.status(400).json({ valid: false, error: "Invalid or expired token" });
  return res.json({ valid: true, email: record.email });
});

export { verifyPassword };
export default router;
