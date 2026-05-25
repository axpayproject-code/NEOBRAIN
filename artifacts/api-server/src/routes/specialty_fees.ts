import { Router } from "express";
import { db, specialtyFeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpsertSpecialtyFeeParams, UpsertSpecialtyFeeBody } from "@workspace/api-zod";

const router = Router();

// Seed default fees if none exist
async function seedDefaultFees() {
  const existing = await db.select().from(specialtyFeesTable);
  if (existing.length > 0) return;

  const defaults = [
    { specialistType: "developmental_pediatrician", feeAmount: 2500, currency: "PHP" },
    { specialistType: "psychologist", feeAmount: 2000, currency: "PHP" },
    { specialistType: "psychiatrist", feeAmount: 3000, currency: "PHP" },
    { specialistType: "speech_therapist", feeAmount: 1800, currency: "PHP" },
    { specialistType: "occupational_therapist", feeAmount: 1800, currency: "PHP" },
    { specialistType: "behavioral_therapist", feeAmount: 2200, currency: "PHP" },
  ];

  for (const d of defaults) {
    await db
      .insert(specialtyFeesTable)
      .values(d)
      .onConflictDoNothing();
  }
}

// List specialty fees
router.get("/specialty-fees", async (_req, res) => {
  await seedDefaultFees();
  const rows = await db.select().from(specialtyFeesTable);
  return res.json(rows.map(r => ({ ...r, updatedAt: r.updatedAt.toISOString() })));
});

// Upsert a specialty fee (admin)
router.put("/specialty-fees/:specialistType", async (req, res) => {
  const paramsParsed = UpsertSpecialtyFeeParams.safeParse({ specialistType: req.params.specialistType });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid specialist type" });

  const bodyParsed = UpsertSpecialtyFeeBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const { specialistType } = paramsParsed.data;
  const { feeAmount, currency } = bodyParsed.data;

  const [row] = await db
    .insert(specialtyFeesTable)
    .values({
      specialistType,
      feeAmount,
      currency: currency ?? "PHP",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: specialtyFeesTable.specialistType,
      set: { feeAmount, currency: currency ?? "PHP", updatedAt: new Date() },
    })
    .returning();

  return res.json({ ...row, updatedAt: row.updatedAt.toISOString() });
});

export default router;
