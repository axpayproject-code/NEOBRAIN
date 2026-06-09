import { Router } from "express";
import { db, appointmentsTable, childrenTable, timelineEventsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { CreateAppointmentBody, GetAppointmentParams, ListAppointmentsQueryParams, UpdateAppointmentBody, UpdateAppointmentParams } from "@workspace/api-zod";
import { sendEmail, notificationEmail } from "../lib/email";

const router = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

// List appointments — scoped to the authenticated user via their children
router.get("/appointments", async (req, res) => {
  const userId = getUserId(req);
  const parsed = ListAppointmentsQueryParams.safeParse(req.query);
  const childId = parsed.success && parsed.data.childId ? Number(parsed.data.childId) : undefined;
  const status = parsed.success ? parsed.data.status : undefined;

  const conditions = [];
  if (userId) conditions.push(eq(childrenTable.userId, userId));
  if (childId) conditions.push(eq(appointmentsTable.childId, childId));
  if (status) conditions.push(eq(appointmentsTable.status, status));

  const query = db
    .select({ appointment: appointmentsTable, childName: childrenTable.fullName })
    .from(appointmentsTable)
    .leftJoin(childrenTable, eq(appointmentsTable.childId, childrenTable.id))
    .orderBy(desc(appointmentsTable.scheduledAt));

  const results = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

  return res.json(
    results.map(({ appointment, childName }) => ({
      ...appointment,
      childName: childName ?? null,
      scheduledAt: appointment.scheduledAt.toISOString(),
      createdAt: appointment.createdAt.toISOString(),
    }))
  );
});

// Create an appointment
router.post("/appointments", async (req, res) => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }

  const { scheduledAt, ...rest } = parsed.data;
  const [appointment] = await db
    .insert(appointmentsTable)
    .values({ ...rest, scheduledAt: new Date(scheduledAt) })
    .returning();

  await db.insert(timelineEventsTable).values({
    childId: parsed.data.childId,
    eventType: "appointment",
    title: `Appointment scheduled with ${parsed.data.specialistName}`,
    description: `${parsed.data.specialistType.replace(/_/g, " ")} appointment on ${new Date(scheduledAt).toLocaleDateString()}`,
    occurredAt: new Date(),
  });

  return res.status(201).json({
    ...appointment,
    childName: null,
    scheduledAt: appointment.scheduledAt.toISOString(),
    createdAt: appointment.createdAt.toISOString(),
  });
});

// Get an appointment
router.get("/appointments/:id", async (req, res) => {
  const parsed = GetAppointmentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [result] = await db
    .select({ appointment: appointmentsTable, childName: childrenTable.fullName })
    .from(appointmentsTable)
    .leftJoin(childrenTable, eq(appointmentsTable.childId, childrenTable.id))
    .where(eq(appointmentsTable.id, parsed.data.id));

  if (!result) return res.status(404).json({ error: "Not found" });

  return res.json({
    ...result.appointment,
    childName: result.childName ?? null,
    scheduledAt: result.appointment.scheduledAt.toISOString(),
    createdAt: result.appointment.createdAt.toISOString(),
  });
});

// Delete an appointment
router.delete("/appointments/:id", async (req, res) => {
  const parsed = GetAppointmentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [deleted] = await db.delete(appointmentsTable).where(eq(appointmentsTable.id, parsed.data.id)).returning({ id: appointmentsTable.id });
  if (!deleted) return res.status(404).json({ error: "Not found" });
  return res.status(204).end();
});

// Update an appointment
router.patch("/appointments/:id", async (req, res) => {
  const paramsParsed = UpdateAppointmentParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateAppointmentBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const { scheduledAt, ...rest } = bodyParsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);

  const [updated] = await db
    .update(appointmentsTable)
    .set(updateData)
    .where(eq(appointmentsTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });

  return res.json({
    ...updated,
    childName: null,
    scheduledAt: updated.scheduledAt.toISOString(),
    createdAt: updated.createdAt.toISOString(),
  });
});

// POST /appointments/:id/pay — submit payment proof for a booked appointment
router.post("/appointments/:id/pay", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const userId = getUserId(req);
  const { paymentMethod, referenceNumber, proofImageBase64, amount } = req.body as {
    paymentMethod: string;
    referenceNumber: string;
    proofImageBase64?: string;
    amount?: number;
  };

  if (!paymentMethod) return res.status(400).json({ error: "Payment method is required." });
  if (!referenceNumber || referenceNumber.trim().length < 3) return res.status(400).json({ error: "A valid transaction reference is required." });
  if (!proofImageBase64 || typeof proofImageBase64 !== "string") return res.status(400).json({ error: "A photo proof of payment is required." });
  if (proofImageBase64.length > 5_000_000) return res.status(400).json({ error: "Proof image is too large. Please compress below 3MB." });

  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  const [updated] = await db.update(appointmentsTable).set({
    paymentStatus: "pending_verification",
    paymentRef: referenceNumber.trim(),
    paymentProofUrl: proofImageBase64,
    feeAmount: amount ?? appt.feeAmount ?? 0,
  }).where(eq(appointmentsTable.id, id)).returning();

  if (!updated) return res.status(404).json({ error: "Not found" });

  // Send notification email if user info available
  if (userId) {
    const [userInfo] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId));
    if (userInfo) {
      sendEmail(notificationEmail(
        userInfo.name, userInfo.email,
        "Appointment Payment Submitted",
        `Your payment proof for your appointment with ${appt.specialistName} has been submitted. Our team will verify it within 1–4 business hours and confirm your booking.`,
      )).catch(() => {});
    }
  }

  return res.json({
    success: true,
    paymentStatus: updated.paymentStatus,
    ref: updated.paymentRef,
    message: "Payment proof received. Appointment will be confirmed within 1–4 business hours.",
  });
});

export default router;
