import { Router } from "express";
import { db } from "@workspace/db";
import { consentRecordsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

const CONSENT_CATEGORIES = [
  "platform_use",
  "school_sharing",
  "clinic_sharing",
  "research_participation",
  "government_aggregation",
] as const;

const getAuth = (req: { headers: { authorization?: string } }) => {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
};

router.get("/consents", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const records = await db.select().from(consentRecordsTable).where(eq(consentRecordsTable.userId, userId));
  return res.json(records);
});

router.get("/consents/categories", async (_req, res) => {
  return res.json(CONSENT_CATEGORIES);
});

router.post("/consents", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { category, childId, granted, version, notes } = req.body as Record<string, unknown>;
  if (!category || typeof category !== "string") return res.status(400).json({ error: "category is required" });
  const now = new Date();
  const [existing] = await db.select().from(consentRecordsTable).where(
    and(eq(consentRecordsTable.userId, userId), eq(consentRecordsTable.category, category))
  );
  if (existing) {
    const [updated] = await db.update(consentRecordsTable)
      .set({
        granted: !!granted,
        grantedAt: granted ? now : existing.grantedAt,
        revokedAt: !granted ? now : null,
        version: typeof version === "string" ? version : existing.version,
        notes: typeof notes === "string" ? notes : existing.notes,
        updatedAt: now,
      })
      .where(eq(consentRecordsTable.id, existing.id))
      .returning();
    return res.json(updated);
  }
  const [record] = await db.insert(consentRecordsTable).values({
    userId,
    childId: typeof childId === "string" ? childId : null,
    category,
    version: typeof version === "string" ? version : "1.0",
    granted: !!granted,
    grantedAt: granted ? now : null,
    notes: typeof notes === "string" ? notes : null,
  }).returning();
  return res.status(201).json(record);
});

router.patch("/consents/:id", async (req, res) => {
  const userId = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { granted, notes } = req.body as Record<string, unknown>;
  const now = new Date();
  const [record] = await db.update(consentRecordsTable)
    .set({
      granted: !!granted,
      grantedAt: granted ? now : undefined,
      revokedAt: !granted ? now : null,
      notes: typeof notes === "string" ? notes : undefined,
      updatedAt: now,
    })
    .where(and(eq(consentRecordsTable.id, id), eq(consentRecordsTable.userId, userId)))
    .returning();
  if (!record) return res.status(404).json({ error: "Not found" });
  return res.json(record);
});

export default router;
