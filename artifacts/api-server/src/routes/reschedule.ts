import { Router } from "express";
import { db, rescheduleRequestsTable, appointmentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  GetRescheduleRequestParams,
  RequestRescheduleParams,
  RequestRescheduleBody,
  RespondToRescheduleParams,
  RespondToRescheduleBody,
  SetMeetingUrlParams,
  SetMeetingUrlBody,
} from "@workspace/api-zod";

const router = Router();

function serializeRequest(r: typeof rescheduleRequestsTable.$inferSelect) {
  return {
    ...r,
    proposedAt: r.proposedAt.toISOString(),
    respondedAt: r.respondedAt ? r.respondedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

function serializeAppointment(a: typeof appointmentsTable.$inferSelect) {
  return {
    ...a,
    childName: null,
    scheduledAt: a.scheduledAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
  };
}

// Get latest reschedule request for an appointment
router.get("/appointments/:id/reschedule", async (req, res) => {
  const parsed = GetRescheduleRequestParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const rows = await db
    .select()
    .from(rescheduleRequestsTable)
    .where(eq(rescheduleRequestsTable.appointmentId, parsed.data.id))
    .orderBy(desc(rescheduleRequestsTable.createdAt));

  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  return res.json(serializeRequest(rows[0]));
});

// Request reschedule
router.post("/appointments/:id/reschedule", async (req, res) => {
  const paramsParsed = RequestRescheduleParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = RequestRescheduleBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const [row] = await db
    .insert(rescheduleRequestsTable)
    .values({
      appointmentId: paramsParsed.data.id,
      requestedByRole: bodyParsed.data.requestedByRole,
      proposedAt: new Date(bodyParsed.data.proposedAt),
      reason: bodyParsed.data.reason,
      status: "pending",
    })
    .returning();

  return res.status(201).json(serializeRequest(row));
});

// Respond to reschedule (approve / reject)
router.patch("/appointments/:id/reschedule", async (req, res) => {
  const paramsParsed = RespondToRescheduleParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = RespondToRescheduleBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  // Find latest pending request for this appointment
  const rows = await db
    .select()
    .from(rescheduleRequestsTable)
    .where(eq(rescheduleRequestsTable.appointmentId, paramsParsed.data.id))
    .orderBy(desc(rescheduleRequestsTable.createdAt));

  const pending = rows.find(r => r.status === "pending");
  if (!pending) return res.status(404).json({ error: "No pending reschedule request found" });

  const [updated] = await db
    .update(rescheduleRequestsTable)
    .set({ status: bodyParsed.data.status, respondedAt: new Date() })
    .where(eq(rescheduleRequestsTable.id, pending.id))
    .returning();

  // If approved, update appointment scheduledAt to the proposed time
  if (bodyParsed.data.status === "approved") {
    await db
      .update(appointmentsTable)
      .set({ scheduledAt: pending.proposedAt })
      .where(eq(appointmentsTable.id, paramsParsed.data.id));
  }

  return res.json(serializeRequest(updated));
});

// Set meeting URL (practitioner sets the video link)
router.patch("/appointments/:id/meeting-url", async (req, res) => {
  const paramsParsed = SetMeetingUrlParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = SetMeetingUrlBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const [updated] = await db
    .update(appointmentsTable)
    .set({ meetingUrl: bodyParsed.data.meetingUrl })
    .where(eq(appointmentsTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });

  return res.json(serializeAppointment(updated));
});

export default router;
