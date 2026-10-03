import type { Request, Response, NextFunction } from "express";
const attempts = new Map<string, { count: number; reset: number }>();
export function authenticationRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    req.method !== "POST" ||
    !/^\/(auth\/(login|signup|forgot-password|reset-password)|otp\/(send|verify))$/.test(
      req.path,
    )
  )
    return next();
  const now = Date.now();
  if (attempts.size > 10000)
    for (const [key, value] of attempts)
      if (value.reset < now) attempts.delete(key);
  const key = `${req.ip}:${req.path}`;
  let value = attempts.get(key);
  if (!value || value.reset < now)
    value = { count: 0, reset: now + 10 * 60000 };
  value.count++;
  attempts.set(key, value);
  if (value.count > 20) {
    res.set("Retry-After", String(Math.ceil((value.reset - now) / 1000)));
    return res
      .status(429)
      .json({ error: "Too many attempts. Please try later." });
  }
  return next();
}
