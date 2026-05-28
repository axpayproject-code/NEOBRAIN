import { Router } from "express";
import { db, appointmentsTable, childrenTable, timelineEventsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { CreateAppointmentBody, GetAppointmentParams, ListAppointmentsQueryParams, UpdateAppointmentBody, UpdateAppointmentParams } from "@workspace/api-zod";

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

export default router;
