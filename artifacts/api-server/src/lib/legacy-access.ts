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
  if (req.path.startsWith("/children")) {
    if (user.role !== "family")
      return res
        .status(403)
        .json({
          error:
            "Child records require a guardian relationship. Assigned professionals use the Case Workspace.",
        });
    const match = req.path.match(/^\/children\/(\d+)/);
    if (match) {
      const [child] = await db
        .select({ id: childrenTable.id })
        .from(childrenTable)
        .where(eq(childrenTable.id, Number(match[1])));
      const [owned] = await db
        .select({ userId: childrenTable.userId })
        .from(childrenTable)
        .where(eq(childrenTable.id, Number(match[1])));
      if (!child || owned?.userId !== user.id)
        return res.status(404).json({ error: "Child unavailable" });
    }
    if (req.path.endsWith("/domain-scores"))
      return res
        .status(403)
        .json({ error: "Clinical scores await approved result migration" });
    if (["POST", "PATCH"].includes(req.method) && req.body) {
      for (const key of [
        "riskLevel",
        "diagnosisNotes",
        "assignedDoctor",
        "therapistId",
        "userId",
      ])
        delete req.body[key];
    }
    const original = res.json.bind(res);
    res.json = ((body: unknown) =>
      original(
        Array.isArray(body)
          ? body.map((c) => sanitizeLegacyChild(c))
          : body && typeof body === "object" && "fullName" in body
            ? sanitizeLegacyChild(body as Record<string, unknown>)
            : body,
      )) as typeof res.json;
    return next();
  }
  const safe =
    /^\/(auth|billing|cases|case-reviewers|professional-profile|otp|healthz)(\/|$)/;
  if (safe.test(req.path)) return next();
  if (user.role === "superadmin" && req.path.startsWith("/admin/"))
    return next();
  return res
    .status(403)
    .json({
      error: "This legacy feature is awaiting case-scoped access migration",
    });
}
