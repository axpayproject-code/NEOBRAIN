import { Router } from "express";
import { db, appointmentPaymentsTable, appointmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { PayAppointmentParams, PayAppointmentBody, GetAppointmentPaymentParams } from "@workspace/api-zod";

const router = Router();

function serializePayment(p: typeof appointmentPaymentsTable.$inferSelect) {
  return {
    ...p,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

// Simulate payment for an appointment
router.post("/appointments/:id/pay", async (req, res) => {
  const paramsParsed = PayAppointmentParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = PayAppointmentBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const { id } = paramsParsed.data;
  const { amount, currency, transactionRef } = bodyParsed.data;

  // Generate a simulated transaction ref if none provided
  const txRef = transactionRef ?? `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  // Create payment record
  const [payment] = await db
    .insert(appointmentPaymentsTable)
    .values({
      appointmentId: id,
      amount,
      currency: currency ?? "PHP",
      status: "paid",
      transactionRef: txRef,
      paidAt: new Date(),
    })
    .returning();

  // Update appointment paymentStatus
  await db
    .update(appointmentsTable)
    .set({ paymentStatus: "paid", feeAmount: amount })
    .where(eq(appointmentsTable.id, id));

  return res.json(serializePayment(payment));
});

// Get payment record for an appointment
router.get("/appointments/:id/payment", async (req, res) => {
  const parsed = GetAppointmentPaymentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const rows = await db
    .select()
    .from(appointmentPaymentsTable)
    .where(eq(appointmentPaymentsTable.appointmentId, parsed.data.id));

  if (rows.length === 0) return res.status(404).json({ error: "No payment found" });

  // Return the latest payment
  const latest = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  return res.json(serializePayment(latest));
});

export default router;
