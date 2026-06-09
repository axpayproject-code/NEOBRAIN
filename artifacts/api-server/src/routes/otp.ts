import { Router } from "express";
import { db } from "@workspace/db";
import { otpCodes } from "@workspace/db";
import { and, eq, gt, desc } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail, otpEmail } from "../lib/email";

const router = Router();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /otp/send — send an OTP code (simulated — logs to console in dev)
router.post("/otp/send", async (req, res) => {
  const { email, purpose = "verify" } = req.body as { email?: string; purpose?: string };
  if (!email) return res.status(400).json({ error: "email is required" });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any previous unused codes for this email/purpose
  await db
    .update(otpCodes)
    .set({ used: true })
    .where(and(eq(otpCodes.email, email), eq(otpCodes.purpose, purpose), eq(otpCodes.used, false)));

  await db.insert(otpCodes).values({ email, code, purpose, expiresAt });

  sendEmail(otpEmail(email, code, purpose)).catch(() => {});

  const isDev = process.env.NODE_ENV !== "production";
  return res.json({
    success: true,
    message: `A verification code was sent to ${email}`,
    ...(isDev ? { code } : {}),
    expiresInMinutes: 10,
  });
});

// POST /otp/verify — verify an OTP code
router.post("/otp/verify", async (req, res) => {
  const { email, code, purpose = "verify" } = req.body as { email?: string; code?: string; purpose?: string };
  if (!email || !code) return res.status(400).json({ error: "email and code are required" });

  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.code, code),
        eq(otpCodes.purpose, purpose),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, new Date())
      )
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!otp) {
    return res.status(400).json({ error: "Invalid or expired verification code" });
  }

  // Mark as used
  await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otp.id));

  return res.json({ success: true, verified: true });
});

export default router;
