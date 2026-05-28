import { Router } from "express";
import { db, appointmentPaymentsTable, appointmentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { PayAppointmentParams, GetAppointmentPaymentParams } from "@workspace/api-zod";
import { z } from "zod";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) return auth.slice(7).trim() || null;
  return null;
}

function serializePayment(p: typeof appointmentPaymentsTable.$inferSelect) {
  return {
    ...p,
    proofImageBase64: undefined,
    proofImageBase64HasValue: !!p.proofImageBase64,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

function serializePaymentFull(p: typeof appointmentPaymentsTable.$inferSelect) {
  return {
    ...p,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

const ManualPayBody = z.object({
  amount: z.number().positive(),
  currency: z.string().default("PHP"),
  paymentMethod: z.string().min(1),
  referenceNumber: z.string().min(1),
  proofImageBase64: z.string().optional(),
});

// Submit manual payment proof for an appointment
router.post("/appointments/:id/pay", async (req, res) => {
  const paramsParsed = PayAppointmentParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = ManualPayBody.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ error: "Invalid input", details: bodyParsed.error.issues });
  }

  const { id } = paramsParsed.data;
  const { amount, currency, paymentMethod, referenceNumber, proofImageBase64 } = bodyParsed.data;

  const txRef = `${paymentMethod.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const [payment] = await db
    .insert(appointmentPaymentsTable)
    .values({
      appointmentId: id,
      amount,
      currency: currency ?? "PHP",
      status: "submitted",
      transactionRef: txRef,
      paymentMethod,
      referenceNumber,
      proofImageBase64: proofImageBase64 ?? null,
      paidAt: new Date(),
    })
    .returning();

  await db
    .update(appointmentsTable)
    .set({ paymentStatus: "submitted", feeAmount: amount, status: "pending_verification" })
    .where(eq(appointmentsTable.id, id));

  return res.json(serializePayment(payment));
});

// Get payment record for an appointment (no proof image to keep payload small)
router.get("/appointments/:id/payment", async (req, res) => {
  const parsed = GetAppointmentPaymentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const rows = await db
    .select()
    .from(appointmentPaymentsTable)
    .where(eq(appointmentPaymentsTable.appointmentId, parsed.data.id))
    .orderBy(desc(appointmentPaymentsTable.createdAt));

  if (rows.length === 0) return res.status(404).json({ error: "No payment found" });
  return res.json(serializePayment(rows[0]));
});

// Doctor: get full payment record including proof image
router.get("/appointments/:id/payment/proof", async (req, res) => {
  const parsed = GetAppointmentPaymentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const rows = await db
    .select()
    .from(appointmentPaymentsTable)
    .where(eq(appointmentPaymentsTable.appointmentId, parsed.data.id))
    .orderBy(desc(appointmentPaymentsTable.createdAt));

  if (rows.length === 0) return res.status(404).json({ error: "No payment found" });
  return res.json(serializePaymentFull(rows[0]));
});

// Doctor: verify (approve) a payment submission
router.post("/appointments/:id/verify-payment", async (req, res) => {
  const parsed = GetAppointmentPaymentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const userId = getUserId(req);
  const { id } = parsed.data;

  await db
    .update(appointmentPaymentsTable)
    .set({ status: "verified", verifiedBy: userId ?? "doctor", verifiedAt: new Date() })
    .where(eq(appointmentPaymentsTable.appointmentId, id));

  const [updated] = await db
    .update(appointmentsTable)
    .set({ paymentStatus: "verified", status: "pending_setup" })
    .where(eq(appointmentsTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Appointment not found" });

  return res.json({
    ...updated,
    childName: null,
    scheduledAt: updated.scheduledAt.toISOString(),
    createdAt: updated.createdAt.toISOString(),
  });
});

// Doctor: reject a payment submission
router.post("/appointments/:id/reject-payment", async (req, res) => {
  const parsed = GetAppointmentPaymentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const { id } = parsed.data;
  const reason = typeof req.body?.reason === "string" ? req.body.reason : "Payment proof invalid";

  await db
    .update(appointmentPaymentsTable)
    .set({ status: "rejected" })
    .where(eq(appointmentPaymentsTable.appointmentId, id));

  const [updated] = await db
    .update(appointmentsTable)
    .set({ paymentStatus: "rejected", status: "payment_rejected" })
    .where(eq(appointmentsTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Appointment not found" });

  return res.json({
    ...updated,
    rejectionReason: reason,
    childName: null,
    scheduledAt: updated.scheduledAt.toISOString(),
    createdAt: updated.createdAt.toISOString(),
  });
});

// Doctor: setup appointment after payment verified
router.patch("/appointments/:id/setup", async (req, res) => {
  const parsed = GetAppointmentPaymentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const SetupBody = z.object({
    meetingUrl: z.string().optional(),
    location: z.string().optional(),
  });

  const bodyParsed = SetupBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });
  if (!bodyParsed.data.meetingUrl && !bodyParsed.data.location) {
    return res.status(400).json({ error: "Provide meetingUrl or location" });
  }

  const { id } = parsed.data;
  const { meetingUrl, location } = bodyParsed.data;

  const updateData: Record<string, unknown> = { status: "scheduled" };
  if (meetingUrl) updateData.meetingUrl = meetingUrl;
  if (location) updateData.location = location;

  const [updated] = await db
    .update(appointmentsTable)
    .set(updateData)
    .where(eq(appointmentsTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Appointment not found" });

  return res.json({
    ...updated,
    childName: null,
    scheduledAt: updated.scheduledAt.toISOString(),
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
