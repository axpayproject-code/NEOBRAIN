import { Router } from "express";
import { db, practitionerAvailabilityTable, appointmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListAvailabilityQueryParams,
  CreateAvailabilityBody,
  DeleteAvailabilityParams,
  GetAvailableSlotsQueryParams,
} from "@workspace/api-zod";

const router = Router();

// List availability blocks
router.get("/availability", async (req, res) => {
  const parsed = ListAvailabilityQueryParams.safeParse(req.query);
  const practitionerName = parsed.success ? parsed.data.practitionerName : undefined;
  const specialistType = parsed.success ? parsed.data.specialistType : undefined;

  let query = db.select().from(practitionerAvailabilityTable);
  const rows = await query;

  const filtered = rows.filter(r => {
    if (practitionerName && r.practitionerName !== practitionerName) return false;
    if (specialistType && r.specialistType !== specialistType) return false;
    return r.isActive !== false;
  });

  return res.json(filtered.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

// Create an availability block
router.post("/availability", async (req, res) => {
  const parsed = CreateAvailabilityBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }

  const [row] = await db.insert(practitionerAvailabilityTable).values(parsed.data).returning();
  return res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

// Delete an availability block
router.delete("/availability/:id", async (req, res) => {
  const parsed = DeleteAvailabilityParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  await db
    .update(practitionerAvailabilityTable)
    .set({ isActive: false })
    .where(eq(practitionerAvailabilityTable.id, parsed.data.id));

  return res.status(204).send();
});

// Compute available time slots for a practitioner on a given date
router.get("/availability/slots", async (req, res) => {
  const parsed = GetAvailableSlotsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }

  const { practitionerName, date, durationMinutes } = parsed.data;
  const slotDuration = durationMinutes ?? 60;

  // Parse date and figure out day of week — always UTC so timezone doesn't shift the date
  const [y, m, d] = date.split("-").map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = dateObj.getUTCDay(); // 0=Sun … 6=Sat

  // Find availability blocks for this practitioner matching either day-of-week or specific date
  const allBlocks = await db
    .select()
    .from(practitionerAvailabilityTable)
    .where(eq(practitionerAvailabilityTable.practitionerName, practitionerName));

  const matchingBlocks = allBlocks.filter(b => {
    if (b.isActive === false) return false;
    if (b.specificDate) return b.specificDate === date;
    if (b.dayOfWeek !== null && b.dayOfWeek !== undefined) return b.dayOfWeek === dayOfWeek;
    return false;
  });

  if (matchingBlocks.length === 0) {
    return res.json([]);
  }

  // Fetch booked appointments for this practitioner on this date
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const bookedAppts = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.specialistName, practitionerName),
        eq(appointmentsTable.status, "scheduled")
      )
    );

  // Filter booked appointments to those on this date (in PH time)
  const bookedOnDate = bookedAppts.filter(a => {
    const at = new Date(a.scheduledAt);
    return at >= dayStart && at <= dayEnd;
  });

  // Build set of booked time strings "HH:MM"
  const bookedTimes = new Set(
    bookedOnDate.map(a => {
      const d = new Date(a.scheduledAt);
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    })
  );

  // Generate slots from all matching blocks
  const allSlots: Array<{ time: string; available: boolean }> = [];
  const seenTimes = new Set<string>();

  for (const block of matchingBlocks) {
    const [startH, startM] = block.startTime.split(":").map(Number);
    const [endH, endM] = block.endTime.split(":").map(Number);

    let current = startH * 60 + startM;
    const end = endH * 60 + endM;
    const step = block.slotDurationMinutes ?? slotDuration;

    while (current + step <= end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      if (!seenTimes.has(timeStr)) {
        seenTimes.add(timeStr);
        allSlots.push({ time: timeStr, available: !bookedTimes.has(timeStr) });
      }

      current += step;
    }
  }

  // Sort chronologically
  allSlots.sort((a, b) => a.time.localeCompare(b.time));

  return res.json(allSlots);
});

export default router;
