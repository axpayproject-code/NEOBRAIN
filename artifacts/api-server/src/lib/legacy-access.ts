import { sanitizeLegacyChild } from "./clinical-preview";
import type { Request, Response, NextFunction } from "express";
import { db, childrenTable } from "@workspace/db";
import { eq } from "drizzle-orm";
/** Fail closed on legacy clinical delivery until records have explicit approvals. */
export async function legacyAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = res.locals.user;
  if (!user) return next();
  const clinical =
    /^\/(reports|screenings|ai-analysis-results|risk-history|therapy-plans|therapy-session-notes|soap-notes|video-analysis|brain-gym|nutrition|developmental-milestones|screening-responses)(\/|$)/;
  if (clinical.test(req.path))
    return res
      .status(403)
      .json({
        error:
          "Use the Case Workspace for reviewed clinical information. Legacy clinical endpoints are unavailable until migrated.",
      });
  const safe =
    /^\/(workflow|auth|otp|healthz)(\/|$)/;
  if (safe.test(req.path)) return next();
  return res
    .status(403)
    .json({
      error: "This legacy feature is awaiting case-scoped access migration",
    });
}
