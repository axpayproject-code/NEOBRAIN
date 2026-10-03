import { expireBookingHolds } from "../lib/booking-holds";
import { endpoint, ident, uid, text } from "./workflow";
import { z } from "zod";
import { and, eq, gt, desc, inArray, sql } from "drizzle-orm";
import * as S from "@workspace/db";
import {
  caseAccess,
  membership,
  verifiedProfessional,
  fail,
  audit,
  notify,
  manageOrganization,
} from "../lib/workflow-access";
import {
  validTransition,
  referralTransitions,
  bookingTransitions,
  ageMonths,
} from "../lib/workflow-policy";
const { db } = S;
endpoint("post", "/workflow/cases/:caseId/referrals", async (req, u) => {
  const a = await caseAccess(u, ident(req.params.caseId));
  if (a.role !== "clinician" || !a.clinical)
    fail(403, "Clinical case access required");
  const b = z
    .object({
      resultId: identSchema(),
      providerId: uid,
      organizationId: identSchema(),
      reason: text,
    })
    .parse(req.body);
  await verifiedProfessional(u.id, "developmental_review");
  await verifiedProfessional(b.providerId);
  const [result] = await db
    .select()
    .from(S.caseResultsTable)
    .where(
      and(
        eq(S.caseResultsTable.id, b.resultId),
        eq(S.caseResultsTable.caseId, a.record.id),
        eq(S.caseResultsTable.status, "approved"),
      ),
    );
  if (!result) fail(409, "Approved clinical result required");
  const m = await membership(b.providerId, b.organizationId);
  if (m?.role !== "clinician") fail(400, "Provider affiliation unavailable");
  const [r] = await db
    .insert(S.referralsTable)
    .values({ caseId: a.record.id, createdBy: u.id, ...b })
    .returning();
  await notify(
    a.record.ownerId,
    "An approved referral is ready for your review",
    a.record.id,
  );
  await audit(u.id, "approve_referral", "referral", String(r.id));
  return r;
});
function identSchema() {
  return z.coerce.number().int().positive();
}
endpoint("post", "/workflow/referrals/:id/route", async (req, u) => {
  const [r] = await db
    .select()
    .from(S.referralsTable)
    .where(eq(S.referralsTable.id, ident(req.params.id)));
  if (!r) fail(404, "Referral unavailable");
  const a = await caseAccess(u, r.caseId);
  if (a.role !== "guardian")
    fail(403, "Guardian sharing authorization required");
  await db
    .insert(S.accessGrantsTable)
    .values({
      caseId: r.caseId,
      userId: r.providerId,
      role: "clinician",
      shareClinical: true,
    })
    .onConflictDoUpdate({
      target: [S.accessGrantsTable.caseId, S.accessGrantsTable.userId],
      set: { role: "clinician", shareClinical: true, revokedAt: null },
    });
  await notify(r.providerId, "A referral has been shared with you", r.caseId);
  await audit(u.id, "authorize_referral_sharing", "referral", String(r.id));
  return { routed: true };
});
endpoint("get", "/workflow/referrals", async (_req, u) => {
  const rows = await db
    .select()
    .from(S.referralsTable)
    .orderBy(desc(S.referralsTable.createdAt));
  const result = [];
  for (const r of rows) {
    try {
      const a = await caseAccess(u, r.caseId);
      if (
        a.role === "clinician" ||
        a.role === "guardian" ||
        a.role === "coordinator" ||
        a.role === "routing"
      )
        result.push({
          ...r,
          reason: a.clinical ? r.reason : "Approved referral",
          outcome: a.clinical ? r.outcome : null,
        });
    } catch {}
  }
  return result;
});
endpoint("post", "/workflow/referrals/:id/status", async (req, u) => {
  const b = z
    .object({
      status: z.enum(["accepted", "declined", "outcome_received", "closed"]),
      outcome: text.optional(),
    })
    .parse(req.body);
  const [r] = await db
    .select()
    .from(S.referralsTable)
    .where(eq(S.referralsTable.id, ident(req.params.id)));
  if (!r) fail(404, "Referral unavailable");
  const a = await caseAccess(u, r.caseId);
  if (b.status !== "closed") await verifiedProfessional(u.id);
  if (
    ["accepted", "declined", "outcome_received"].includes(b.status) &&
    r.providerId !== u.id
  )
    fail(403, "Receiving provider required");
  if (b.status === "closed" && !["clinician", "coordinator"].includes(a.role))
    fail(403, "Care team required");
  if (!validTransition(referralTransitions, r.status, b.status))
    fail(409, "Invalid referral transition");
  if (b.status === "outcome_received" && !b.outcome)
    fail(400, "Record the outcome");
  await db
    .update(S.referralsTable)
    .set({ status: b.status, outcome: b.outcome })
    .where(eq(S.referralsTable.id, r.id));
  await audit(u.id, `referral_${b.status}`, "referral", String(r.id));
  return { status: b.status };
});
endpoint("get", "/workflow/slots", async (req, u) => {
  await expireBookingHolds();
  const organizationId = req.query.organizationId
    ? ident(req.query.organizationId)
    : null;
  const rows = await db
    .select()
    .from(S.availabilitySlotsTable)
    .where(
      organizationId
        ? eq(S.availabilitySlotsTable.organizationId, organizationId)
        : undefined,
    )
    .orderBy(S.availabilitySlotsTable.startsAt);
  const result = [];
  for (const slot of rows) {
    if (slot.providerId === u.id) {
      result.push(slot);
      continue;
    }
    if (slot.status !== "available" || slot.startsAt <= new Date()) continue;
    try {
      await verifiedProfessional(slot.providerId);
      if (await membership(slot.providerId, slot.organizationId))
        result.push(slot);
    } catch {}
  }
  return result;
});
endpoint("post", "/workflow/slots", async (req, u) => {
  await verifiedProfessional(u.id);
  const b = z
    .object({
      organizationId: identSchema(),
      startsAt: z.string().datetime(),
      endsAt: z.string().datetime(),
      mode: z.enum(["remote", "onsite"]),
      feeCentavos: z.number().int().min(0).max(10000000),
      cancellationPolicy: text,
      location: text.optional(),
    })
    .parse(req.body);
  const m = await membership(u.id, b.organizationId);
  if (m?.role !== "clinician") fail(403, "Clinical affiliation required");
  const start = new Date(b.startsAt),
    end = new Date(b.endsAt);
  if (start <= new Date() || end <= start)
    fail(400, "Future start and later end required");
  if (b.mode === "onsite" && !b.location) fail(400, "Onsite location required");
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${u.id}))`);
    const clashes = await tx
      .select()
      .from(S.availabilitySlotsTable)
      .where(
        and(
          eq(S.availabilitySlotsTable.providerId, u.id),
          sql`${S.availabilitySlotsTable.startsAt}<${end.toISOString()}::timestamptz`,
          sql`${S.availabilitySlotsTable.endsAt}>${start.toISOString()}::timestamptz`,
          sql`${S.availabilitySlotsTable.status}<>'cancelled'`,
        ),
      );
    if (clashes.length) fail(409, "This time overlaps an existing slot");
    const [s] = await tx
      .insert(S.availabilitySlotsTable)
      .values({ ...b, startsAt: start, endsAt: end, providerId: u.id })
      .returning();
    return s;
  });
});
endpoint("post", "/workflow/bookings", async (req, u) => {
  await expireBookingHolds();
  const b = z
    .object({
      caseId: identSchema(),
      slotId: identSchema(),
      referralId: identSchema().optional(),
      acceptTerms: z.literal(true),
    })
    .parse(req.body);
  const a = await caseAccess(u, b.caseId);
  if (a.role !== "guardian") fail(403, "Guardian booking required");
  return db.transaction(async (tx) => {
    const [slot] = await tx
      .select()
      .from(S.availabilitySlotsTable)
      .where(eq(S.availabilitySlotsTable.id, b.slotId))
      .for("update");
    if (!slot || slot.status !== "available" || slot.startsAt <= new Date())
      fail(409, "Slot no longer available");
    await verifiedProfessional(slot.providerId, undefined, tx);
    if (!(await membership(slot.providerId, slot.organizationId, tx)))
      fail(409, "Provider affiliation unavailable");
    if (b.referralId) {
      const [ref] = await tx
        .select()
        .from(S.referralsTable)
        .where(eq(S.referralsTable.id, b.referralId));
      if (
        !ref ||
        ref.caseId !== b.caseId ||
        ref.providerId !== slot.providerId ||
        ref.organizationId !== slot.organizationId ||
        ref.status !== "accepted"
      )
        fail(409, "Accepted referral must match this provider and facility");
    }
    const [booking] = await tx
      .insert(S.bookingsTable)
      .values({
        caseId: b.caseId,
        slotId: slot.id,
        referralId: b.referralId,
        guardianId: u.id,
        providerId: slot.providerId,
        organizationId: slot.organizationId,
        amountCentavos: slot.feeCentavos,
        paymentStatus: slot.feeCentavos === 0 ? "not_required" : "unpaid",
        status: slot.feeCentavos === 0 ? "confirmed" : "payment_pending",
        holdExpiresAt:
          slot.feeCentavos > 0 ? new Date(Date.now() + 30 * 60000) : null,
        location: slot.location,
      })
      .returning();
    await tx
      .update(S.availabilitySlotsTable)
      .set({ status: "reserved" })
      .where(eq(S.availabilitySlotsTable.id, slot.id));
    await tx
      .insert(S.accessGrantsTable)
      .values({
        caseId: b.caseId,
        userId: slot.providerId,
        role: "clinician",
        shareClinical: true,
      })
      .onConflictDoUpdate({
        target: [S.accessGrantsTable.caseId, S.accessGrantsTable.userId],
        set: { role: "clinician", shareClinical: true, revokedAt: null },
      });
    if (slot.feeCentavos > 0)
      await tx.insert(S.ordersTable).values({
        bookingId: booking.id,
        payerId: u.id,
        organizationId: slot.organizationId,
        amountCentavos: slot.feeCentavos,
      });
    if (b.referralId)
      await tx
        .update(S.referralsTable)
        .set({ status: "appointment_arranged" })
        .where(eq(S.referralsTable.id, b.referralId));
    return booking;
  });
});
endpoint("get", "/workflow/bookings", async (_req, u) => {
  const rows = await db
    .select({ booking: S.bookingsTable, slot: S.availabilitySlotsTable })
    .from(S.bookingsTable)
    .innerJoin(
      S.availabilitySlotsTable,
      eq(S.availabilitySlotsTable.id, S.bookingsTable.slotId),
    )
    .orderBy(S.availabilitySlotsTable.startsAt);
  const result = [];
  for (const { booking, slot } of rows) {
    try {
      const a = await caseAccess(u, booking.caseId);
      if (["guardian", "clinician", "coordinator", "routing"].includes(a.role))
        result.push({
          ...booking,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          mode: slot.mode,
          meetingUrl:
            u.id === booking.guardianId || u.id === booking.providerId
              ? booking.meetingUrl
              : null,
          callbackPhone: null,
          currentLocation: null,
        });
    } catch {}
  }
  return result;
});
endpoint("post", "/workflow/bookings/:id/status", async (req, u) => {
  const b = z
    .object({
      status: z.enum([
        "checked_in",
        "waiting",
        "in_consultation",
        "encounter_completed",
        "cancelled",
        "no_show",
      ]),
      callbackPhone: z.string().min(5).max(50).optional(),
      currentLocation: text.optional(),
    })
    .parse(req.body);
  const id = ident(req.params.id);
  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(S.bookingsTable)
      .where(eq(S.bookingsTable.id, id))
      .for("update");
    if (!booking) fail(404, "Booking unavailable");
    const a = await caseAccess(u, booking.caseId, tx);
    if (!["guardian", "clinician", "coordinator", "routing"].includes(a.role))
      fail(403, "Booking access required");
    const own = booking.guardianId === u.id;
    if (own && !["checked_in", "cancelled"].includes(b.status))
      fail(403, "Care team updates this status");
    if (
      !own &&
      booking.providerId !== u.id &&
      !["coordinator", "routing"].includes(a.role)
    )
      fail(403, "Responsible care team required");
    if (!validTransition(bookingTransitions, booking.status, b.status))
      fail(409, "Invalid booking transition");
    const [slot] = await tx
      .select()
      .from(S.availabilitySlotsTable)
      .where(eq(S.availabilitySlotsTable.id, booking.slotId));
    if (
      b.status === "checked_in" &&
      slot.mode === "remote" &&
      (!b.callbackPhone || !b.currentLocation)
    )
      fail(
        400,
        "Remote check-in requires callback number and current location",
      );
    if (b.status === "in_consultation") {
      if (booking.providerId !== u.id)
        fail(403, "Consulting clinician required");
      await verifiedProfessional(u.id, undefined, tx);
    }
    await tx
      .update(S.bookingsTable)
      .set({
        status: b.status,
        callbackPhone: b.callbackPhone,
        currentLocation: b.currentLocation,
      })
      .where(eq(S.bookingsTable.id, id));
    if (b.status === "cancelled") {
      if (booking.referralId)
        await tx
          .update(S.referralsTable)
          .set({ status: "accepted" })
          .where(
            and(
              eq(S.referralsTable.id, booking.referralId),
              eq(S.referralsTable.status, "appointment_arranged"),
            ),
          );
      await tx
        .update(S.availabilitySlotsTable)
        .set({ status: "available" })
        .where(eq(S.availabilitySlotsTable.id, booking.slotId));
      if (booking.paymentStatus === "sponsored" && booking.sponsorProgramId)
        await tx
          .update(S.programsV2Table)
          .set({
            spentCentavos: sql`GREATEST(0,${S.programsV2Table.spentCentavos}-${booking.amountCentavos})`,
          })
          .where(eq(S.programsV2Table.id, booking.sponsorProgramId));
    }
    if (b.status === "in_consultation")
      await tx
        .insert(S.encountersTable)
        .values({
          bookingId: id,
          caseId: booking.caseId,
          providerId: booking.providerId,
        })
        .onConflictDoNothing();
    await tx.insert(S.auditLogsTable).values({
      userId: u.id,
      action: `booking_${b.status}`,
      resourceType: "booking",
      resourceId: String(id),
    });
    return {
      status: b.status,
      refundNeeded:
        b.status === "cancelled" && booking.paymentStatus === "paid",
    };
  });
});
endpoint("post", "/workflow/bookings/:id/setup", async (req, u) => {
  const b = z
    .object({
      meetingUrl: z
        .string()
        .url()
        .refine((v) => new URL(v).protocol === "https:")
        .optional(),
      location: text.optional(),
    })
    .parse(req.body);
  const [booking] = await db
    .select()
    .from(S.bookingsTable)
    .where(eq(S.bookingsTable.id, ident(req.params.id)));
  if (!booking || booking.providerId !== u.id)
    fail(403, "Consulting provider required");
  await caseAccess(u, booking.caseId);
  await verifiedProfessional(u.id);
  const [slot] = await db
    .select()
    .from(S.availabilitySlotsTable)
    .where(eq(S.availabilitySlotsTable.id, booking.slotId));
  if (slot.mode === "remote" && !b.meetingUrl)
    fail(400, "Secure meeting URL required");
  if (slot.mode === "onsite" && !b.location)
    fail(400, "Facility instructions required");
  await db
    .update(S.bookingsTable)
    .set(b)
    .where(eq(S.bookingsTable.id, booking.id));
  return { configured: true };
});
endpoint("get", "/workflow/encounters", async (_req, u) => {
  const rows = await db.select().from(S.encountersTable);
  const result = [];
  for (const e of rows) {
    try {
      const a = await caseAccess(u, e.caseId);
      if (e.providerId === u.id || (a.clinical && e.status === "approved"))
        result.push(e);
    } catch {}
  }
  return result;
});
endpoint("post", "/workflow/encounters/:id", async (req, u) => {
  const b = z
    .object({
      notes: text,
      approve: z.boolean().default(false),
      scope: z.enum([
        "medical_report",
        "therapy_assessment",
        "nutrition_assessment",
      ]),
    })
    .parse(req.body);
  const [enc] = await db
    .select()
    .from(S.encountersTable)
    .where(eq(S.encountersTable.id, ident(req.params.id)));
  if (!enc || enc.providerId !== u.id)
    fail(403, "Consulting clinician required");
  await caseAccess(u, enc.caseId);
  await verifiedProfessional(u.id, b.scope);
  if (enc.status === "approved")
    fail(
      409,
      "Approved encounter is immutable. Create an amended case result.",
    );
  await db.transaction(async (tx) => {
    await tx
      .update(S.encountersTable)
      .set({
        notes: b.notes,
        status: b.approve ? "approved" : "draft",
        approvedAt: b.approve ? new Date() : null,
      })
      .where(eq(S.encountersTable.id, enc.id));
    if (b.approve) {
      await tx.insert(S.caseResultsTable).values({
        caseId: enc.caseId,
        authorId: u.id,
        resultType: b.scope,
        content: b.notes,
        status: "approved",
        approvedBy: u.id,
        approvedAt: new Date(),
      });
      await tx.insert(S.auditLogsTable).values({
        userId: u.id,
        action: "approve_consultation",
        resourceType: "encounter",
        resourceId: String(enc.id),
      });
    }
  });
  return { approved: b.approve };
});
endpoint("post", "/workflow/bookings/:id/sponsor", async (req, u) => {
  const b = z.object({ programId: identSchema() }).parse(req.body);
  const [booking] = await db
    .select()
    .from(S.bookingsTable)
    .where(eq(S.bookingsTable.id, ident(req.params.id)));
  if (!booking) fail(404, "Booking unavailable");
  const [program] = await db
    .select()
    .from(S.programsV2Table)
    .where(eq(S.programsV2Table.id, b.programId));
  if (!program) fail(404, "Program unavailable");
  await manageOrganization(u, program.organizationId);
  if (booking.sponsorProgramId !== program.id)
    fail(403, "Guardian must request this sponsorship first");
  return db.transaction(async (tx) => {
    const [p] = await tx
      .select()
      .from(S.programsV2Table)
      .where(eq(S.programsV2Table.id, program.id))
      .for("update");
    const [bkg] = await tx
      .select()
      .from(S.bookingsTable)
      .where(eq(S.bookingsTable.id, booking.id))
      .for("update");
    if (bkg.holdExpiresAt && bkg.holdExpiresAt < new Date())
      fail(409, "Booking hold expired");
    if (bkg.paymentStatus !== "unpaid" || bkg.status !== "payment_pending")
      fail(409, "Unpaid booking required");
    if (
      p.status !== "active" ||
      p.budgetCentavos - p.spentCentavos < booking.amountCentavos
    )
      fail(409, "Sponsor budget unavailable");
    await tx
      .update(S.programsV2Table)
      .set({ spentCentavos: p.spentCentavos + booking.amountCentavos })
      .where(eq(S.programsV2Table.id, p.id));
    await tx
      .update(S.bookingsTable)
      .set({
        paymentStatus: "sponsored",
        status: "confirmed",
        holdExpiresAt: null,
      })
      .where(eq(S.bookingsTable.id, booking.id));
    await tx
      .update(S.ordersTable)
      .set({ status: "sponsored" })
      .where(eq(S.ordersTable.bookingId, booking.id));
    await tx.insert(S.auditLogsTable).values({
      userId: u.id,
      action: "sponsor_booking",
      resourceType: "booking",
      resourceId: String(booking.id),
    });
    return { sponsored: true };
  });
});
endpoint("get", "/workflow/programs", async (_req, u) => {
  const rows = await db.select().from(S.programsV2Table);
  const visible = [];
  for (const p of rows) {
    if (u.role === "superadmin" || (await membership(u.id, p.organizationId)))
      visible.push(p);
  }
  return visible;
});
endpoint("post", "/workflow/programs", async (req, u) => {
  const b = z
    .object({
      organizationId: identSchema(),
      name: text,
      budgetCentavos: z.number().int().nonnegative(),
    })
    .parse(req.body);
  await manageOrganization(u, b.organizationId);
  const [p] = await db.insert(S.programsV2Table).values(b).returning();
  return p;
});
endpoint("get", "/workflow/resources", async (_req, u) =>
  db
    .select()
    .from(S.resourcesV2Table)
    .where(eq(S.resourcesV2Table.status, "approved")),
);
endpoint("post", "/workflow/resources", async (req, u) => {
  if (u.role !== "superadmin")
    fail(403, "Platform content administrator required");
  const b = z
    .object({
      title: text,
      content: text,
      minAgeMonths: z.number().int().min(0).max(155),
      maxAgeMonths: z.number().int().min(0).max(155),
    })
    .parse(req.body);
  if (b.maxAgeMonths < b.minAgeMonths) fail(400, "Invalid age range");
  const [r] = await db.insert(S.resourcesV2Table).values(b).returning();
  return r;
});
endpoint("get", "/workflow/resource-review", async (_req, u) => {
  await verifiedProfessional(u.id, "developmental_review");
  return db
    .select()
    .from(S.resourcesV2Table)
    .where(eq(S.resourcesV2Table.status, "draft"));
});
endpoint("post", "/workflow/resources/:id/approve", async (req, u) => {
  await verifiedProfessional(u.id, "developmental_review");
  const [r] = await db
    .update(S.resourcesV2Table)
    .set({ status: "approved", approvedBy: u.id })
    .where(
      and(
        eq(S.resourcesV2Table.id, ident(req.params.id)),
        eq(S.resourcesV2Table.status, "draft"),
      ),
    )
    .returning();
  if (!r) fail(409, "Draft unavailable");
  await audit(u.id, "approve_support_content", "resource", String(r.id));
  return r;
});
endpoint("get", "/workflow/analytics", async (req, u) => {
  const organizationId = ident(req.query.organizationId);
  const m = await membership(u.id, organizationId);
  if (
    u.role !== "superadmin" &&
    (!m || !["manager", "analyst", "coordinator"].includes(m.role))
  )
    fail(403, "Program reporting access required");
  const cases = await db
    .select()
    .from(S.casesTable)
    .where(eq(S.casesTable.organizationId, organizationId));
  const bookings = await db
    .select()
    .from(S.bookingsTable)
    .where(eq(S.bookingsTable.organizationId, organizationId));
  const referrals = await db
    .select()
    .from(S.referralsTable)
    .where(eq(S.referralsTable.organizationId, organizationId));
  const reviewed = cases.filter((c) => c.status === "reviewed").length;
  const attended = bookings.filter(
    (b) => b.status === "encounter_completed",
  ).length;
  const completed = referrals.filter((r) => r.status === "closed").length;
  const isProgram = m?.role === "analyst" || u.role === "government";
  const count = (n: number) => (isProgram && n > 0 && n < 5 ? null : n);
  return {
    cases: count(cases.length),
    pendingReview: count(cases.length - reviewed),
    reviewed: count(reviewed),
    bookings: count(bookings.length),
    attended: count(attended),
    referrals: count(referrals.length),
    closedReferrals: count(completed),
    smallCountsSuppressed: isProgram,
    asOf: new Date().toISOString(),
  };
});
endpoint("get", "/workflow/audit", async (_req, u) => {
  if (u.role !== "superadmin") fail(403, "Platform administrator required");
  return db
    .select({
      id: S.auditLogsTable.id,
      action: S.auditLogsTable.action,
      resourceType: S.auditLogsTable.resourceType,
      resourceId: S.auditLogsTable.resourceId,
      occurredAt: S.auditLogsTable.occurredAt,
    })
    .from(S.auditLogsTable)
    .orderBy(desc(S.auditLogsTable.occurredAt))
    .limit(200);
});

endpoint("get", "/workflow/sponsor-directory", async () =>
  db
    .select({
      id: S.programsV2Table.id,
      name: S.programsV2Table.name,
      organization: S.organizationsTable.name,
    })
    .from(S.programsV2Table)
    .innerJoin(
      S.organizationsTable,
      eq(S.organizationsTable.id, S.programsV2Table.organizationId),
    )
    .where(
      and(
        eq(S.programsV2Table.status, "active"),
        eq(S.organizationsTable.status, "active"),
      ),
    ),
);
endpoint(
  "post",
  "/workflow/bookings/:id/request-sponsorship",
  async (req, u) => {
    const b = z
      .object({ programId: identSchema(), consent: z.literal(true) })
      .parse(req.body);
    const [booking] = await db
      .select()
      .from(S.bookingsTable)
      .where(eq(S.bookingsTable.id, ident(req.params.id)));
    if (!booking || booking.guardianId !== u.id)
      fail(403, "Booking guardian required");
    await caseAccess(u, booking.caseId);
    if (booking.status !== "payment_pending")
      fail(409, "Unpaid booking required");
    const [p] = await db
      .select()
      .from(S.programsV2Table)
      .where(eq(S.programsV2Table.id, b.programId));
    if (!p || p.status !== "active") fail(404, "Program unavailable");
    await db
      .update(S.bookingsTable)
      .set({ sponsorProgramId: p.id })
      .where(eq(S.bookingsTable.id, booking.id));
    await audit(u.id, "request_sponsorship", "booking", String(booking.id));
    return { requested: true };
  },
);
endpoint("get", "/workflow/sponsorship-requests", async (_req, u) => {
  const rows = await db
    .select({
      id: S.bookingsTable.id,
      programId: S.programsV2Table.id,
      program: S.programsV2Table.name,
      organizationId: S.programsV2Table.organizationId,
      amountCentavos: S.bookingsTable.amountCentavos,
      status: S.bookingsTable.status,
      holdExpiresAt: S.bookingsTable.holdExpiresAt,
    })
    .from(S.bookingsTable)
    .innerJoin(
      S.programsV2Table,
      eq(S.programsV2Table.id, S.bookingsTable.sponsorProgramId),
    )
    .where(eq(S.bookingsTable.status, "payment_pending"));
  const visible = [];
  for (const r of rows) {
    try {
      await manageOrganization(u, r.organizationId);
      visible.push(r);
    } catch {}
  }
  return visible;
});

endpoint("post", "/workflow/slots/:id/cancel", async (req, u) => {
  const id = ident(req.params.id);
  const [slot] = await db
    .select()
    .from(S.availabilitySlotsTable)
    .where(eq(S.availabilitySlotsTable.id, id));
  if (!slot || slot.providerId !== u.id) fail(403, "Slot provider required");
  const [updated] = await db
    .update(S.availabilitySlotsTable)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(S.availabilitySlotsTable.id, id),
        eq(S.availabilitySlotsTable.status, "available"),
      ),
    )
    .returning();
  if (!updated)
    fail(409, "Cancel the booking before withdrawing a reserved slot");
  await audit(u.id, "withdraw_availability", "slot", String(id));
  return { cancelled: true };
});
