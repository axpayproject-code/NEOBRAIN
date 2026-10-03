import { randomBytes, createHash } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { db, sessionsTable, usersTable, userOnboardingTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function startSession(res: Response, userId: string) {
  const token = randomBytes(32).toString("hex");
  await db
    .insert(sessionsTable)
    .values({
      id: hash(token),
      userId,
      expiresAt: new Date(Date.now() + 86400000),
    });
  res.cookie("neobrain_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 86400000,
    path: "/",
  });
}
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("origin");
    try {
      if (origin && new URL(origin).host !== req.get("host"))
        return res.status(403).json({ error: "Invalid request origin" });
    } catch {
      return res.status(403).json({ error: "Invalid request origin" });
    }
  }
  const publicPaths = [
    "/auth/login",
    "/auth/signup",
    "/otp/send",
    "/otp/verify",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-reset-token",
    "/healthz",
  ];
  if (publicPaths.includes(req.path)) return next();
  const token = req.cookies?.neobrain_session;
  if (!token) return res.status(401).json({ error: "Sign in required" });
  const [row] = await db
    .select({ user: usersTable })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId))
    .where(
      and(
        eq(sessionsTable.id, hash(token)),
        gt(sessionsTable.expiresAt, new Date()),
      ),
    );
  if (!row) return res.status(401).json({ error: "Session expired" });
  const [onboarding]=await db.select().from(userOnboardingTable).where(eq(userOnboardingTable.userId,row.user.id));
  if(!onboarding?.emailVerifiedAt && !["/auth/me","/auth/logout","/workflow/me"].includes(req.path)) return res.status(403).json({error:"Verify your email to activate this account"});
  res.locals.user = row.user;
  // Compatibility adapter: legacy handlers receive only the server-verified identity.
  req.headers.authorization = `Bearer ${row.user.id}`;
  next();
}
export async function endSession(req: Request, res: Response) {
  if (req.cookies?.neobrain_session)
    await db
      .delete(sessionsTable)
      .where(eq(sessionsTable.id, hash(req.cookies.neobrain_session)));
  res.clearCookie("neobrain_session", { path: "/" });
}
