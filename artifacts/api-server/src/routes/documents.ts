import { Router } from "express";
import { db, documentsTable } from "@workspace/db";
import { eq, desc, and, isNull } from "drizzle-orm";

const router = Router();

function serialize(r: typeof documentsTable.$inferSelect) {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt?.toISOString() ?? null,
    deletedAt: r.deletedAt?.toISOString() ?? null,
  };
}

router.get("/documents", async (req, res) => {
  const childId = req.query.childId ? Number(req.query.childId) : undefined;
  const documentType = req.query.documentType as string | undefined;

  const conditions = [isNull(documentsTable.deletedAt)];
  if (childId) conditions.push(eq(documentsTable.childId, childId));
  if (documentType) conditions.push(eq(documentsTable.documentType, documentType));

  const rows = await db.select().from(documentsTable)
    .where(and(...conditions))
    .orderBy(desc(documentsTable.createdAt));

  return res.json(rows.map(serialize));
});

router.get("/documents/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [row] = await db.select().from(documentsTable)
    .where(and(eq(documentsTable.id, id), isNull(documentsTable.deletedAt)));
  if (!row) return res.status(404).json({ error: "Not found" });

  return res.json(serialize(row));
});

router.post("/documents", async (req, res) => {
  const { childId, uploadedBy, uploaderRole, documentType, title, description,
    fileName, mimeType, fileSizeBytes, storageKey, relatedResourceType,
    relatedResourceId, isConfidential, expiresAt } = req.body;

  if (!documentType || !title || !fileName || !storageKey) {
    return res.status(400).json({ error: "documentType, title, fileName, and storageKey are required" });
  }

  const [row] = await db.insert(documentsTable).values({
    childId, uploadedBy, uploaderRole, documentType, title, description,
    fileName, mimeType, fileSizeBytes, storageKey,
    relatedResourceType, relatedResourceId,
    isConfidential: isConfidential ?? "false",
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  }).returning();

  return res.status(201).json(serialize(row));
});

router.delete("/documents/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [updated] = await db.update(documentsTable)
    .set({ deletedAt: new Date() })
    .where(and(eq(documentsTable.id, id), isNull(documentsTable.deletedAt)))
    .returning({ id: documentsTable.id });

  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.status(204).end();
});

export default router;
