import { Router, type Request, type Response } from "express";
import { z, ZodError } from "zod";
import {
  and,
  eq,
  or,
  desc,
  inArray,
  isNull,
  isNotNull,
  gt,
  sql,
} from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import * as S from "@workspace/db";
import {
  caseAccess,
  membership,
  manageOrganization,
  verifiedProfessional,
  fail,
  WorkflowError,
  audit,
  notify,
} from "../lib/workflow-access";
import { supportedChildAge } from "../lib/case-policy";
import {
  memberRoles,
  resultTypes,
  validTransition,
  referralTransitions,
  bookingTransitions,
  ageBand,
  ageMonths,
} from "../lib/workflow-policy";
import { sendEmail } from "../lib/email";
const { db } = S;
const router = Router();
const positive = z.coerce.number().int().positive();
const ident = (value: unknown) => positive.parse(value);
const uid = z.string().uuid();
const text = z.string().trim().min(3).max(20000);
type User = { id: string; role: string; email: string; name: string };
function endpoint(
  method: "get" | "post" | "patch",
  path: string,
  fn: (req: Request, user: User) => Promise<unknown>,
) {
  router[method](path, async (req: Request, res: Response) => {
    try {
      const data = await fn(req, res.locals.user);
      res.json(data ?? { success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.issues });
      } else if (error instanceof WorkflowError) {
        res.status(error.status).json({ error: error.message });
      } else {
        req.log.error({ err: error }, "Workflow operation failed");
        res.status(500).json({
          error: "Operation failed. Please retry or contact support.",
        });
      }
    }
  });
}
async function manager(req: Request, u: User) {
  const id = ident(req.params.orgId);
  await manageOrganization(u, id);
  return id;
}
endpoint("get", "/workflow/me", async (_req, u) => {
  const affiliations = await db
    .select({
      membership: S.membershipsTable,
      organization: S.organizationsTable,
    })
    .from(S.membershipsTable)
    .innerJoin(
      S.organizationsTable,
      eq(S.organizationsTable.id, S.membershipsTable.organizationId),
    )
    .where(
      and(
        eq(S.membershipsTable.userId, u.id),
        eq(S.membershipsTable.status, "active"),
      ),
    );
  const [professional] = await db
    .select()
    .from(S.professionalProfilesTable)
    .where(eq(S.professionalProfilesTable.userId, u.id));
  const [onboarding] = await db
    .select()
    .from(S.userOnboardingTable)
    .where(eq(S.userOnboardingTable.userId, u.id));
  const workspaces = new Set<string>();
  if (u.role !== "family" && u.role !== "superadmin")
    workspaces.add("organization");
  if (u.role === "family") workspaces.add("family");
  if (u.role === "clinic") workspaces.add("clinical");
  if (u.role === "school") workspaces.add("school");
  if (u.role === "government") workspaces.add("program");
  if (u.role === "superadmin") workspaces.add("platform");
  for (const a of affiliations.filter(
    (a) => a.organization.status === "active",
  )) {
    if (a.membership.role === "manager") workspaces.add("organization");
    if (["manager", "coordinator", "frontliner"].includes(a.membership.role))
      workspaces.add("coordination");
    if (a.membership.role === "clinician") workspaces.add("clinical");
    if (a.membership.role === "teacher") workspaces.add("school");
    if (a.membership.role === "analyst") workspaces.add("program");
  }
  return {
    user: { id: u.id, name: u.name, email: u.email, role: u.role },
    affiliations,
    professional,
    onboarding,
    workspaces: [...workspaces],
    paymentsEnabled: Boolean(process.env.PAYMONGO_SECRET_KEY),
    uploadsEnabled:
      process.env.NODE_ENV !== "production" ||
      Boolean(process.env.FILE_ENCRYPTION_KEY),
  };
});
endpoint("post", "/workflow/onboarding", async (req, u) => {
  const body = z
    .object({
      training: z.literal(true).optional(),
      guardianAttestation: z.literal(true).optional(),
    })
    .parse(req.body);
  const updates = {
    ...(body.training ? { trainingCompletedAt: new Date() } : {}),
    ...(body.guardianAttestation ? { guardianAttestedAt: new Date() } : {}),
  };
  await db
    .insert(S.userOnboardingTable)
    .values({ userId: u.id, ...updates })
    .onConflictDoUpdate({ target: S.userOnboardingTable.userId, set: updates });
  return updates;
});
endpoint("get", "/workflow/organizations", async (_req, u) => {
  if (u.role === "superadmin")
    return db
      .select()
      .from(S.organizationsTable)
      .orderBy(desc(S.organizationsTable.createdAt));
  const rows = await db
    .select({ organization: S.organizationsTable })
    .from(S.membershipsTable)
    .innerJoin(
      S.organizationsTable,
      eq(S.organizationsTable.id, S.membershipsTable.organizationId),
    )
    .where(
      and(
        eq(S.membershipsTable.userId, u.id),
        eq(S.membershipsTable.status, "active"),
      ),
    );
  return rows.map((r) => r.organization);
});
endpoint("get", "/workflow/providers", async () => {
  const rows = await db
    .select({
      id: S.usersTable.id,
      name: S.usersTable.name,
      specialty: S.professionalProfilesTable.specialty,
      expiresAt: S.professionalProfilesTable.expiresAt,
      organizationId: S.organizationsTable.id,
      organization: S.organizationsTable.name,
    })
    .from(S.professionalProfilesTable)
    .innerJoin(
      S.usersTable,
      eq(S.usersTable.id, S.professionalProfilesTable.userId),
    )
    .innerJoin(
      S.membershipsTable,
      eq(S.membershipsTable.userId, S.usersTable.id),
    )
    .innerJoin(
      S.organizationsTable,
      eq(S.organizationsTable.id, S.membershipsTable.organizationId),
    )
    .where(
      and(
        isNotNull(S.professionalProfilesTable.verifiedAt),
        gt(S.professionalProfilesTable.expiresAt, new Date()),
        eq(S.membershipsTable.status, "active"),
        eq(S.membershipsTable.role, "clinician"),
        eq(S.organizationsTable.status, "active"),
      ),
    );
  return rows;
});
endpoint("post", "/workflow/organizations", async (req, u) => {
  if (u.role === "family")
    fail(403, "Professional or organization account required");
  const b = z
    .object({
      name: text,
      type: z.enum(["clinic", "school", "government", "ngo"]),
      region: z.string().max(150).optional(),
      billingEmail: z.string().email(),
    })
    .parse(req.body);
  return db.transaction(async (tx) => {
    const [org] = await tx
      .insert(S.organizationsTable)
      .values({ ...b, createdBy: u.id })
      .returning();
    await tx
      .insert(S.membershipsTable)
      .values({ organizationId: org.id, userId: u.id, role: "manager" });
    return org;
  });
});
endpoint("post", "/workflow/organizations/:orgId/activate", async (req, u) => {
  if (u.role !== "superadmin") fail(403, "Platform administrator required");
  const id = ident(req.params.orgId);
  const [org] = await db
    .update(S.organizationsTable)
    .set({ status: "active" })
    .where(eq(S.organizationsTable.id, id))
    .returning();
  if (!org) fail(404, "Organization unavailable");
  await audit(u.id, "activate_organization", "organization", String(id));
  return org;
});
endpoint("get", "/workflow/organizations/:orgId/members", async (req, u) => {
  const id = await manager(req, u);
  return db
    .select({
      id: S.usersTable.id,
      name: S.usersTable.name,
      email: S.usersTable.email,
      role: S.membershipsTable.role,
      status: S.membershipsTable.status,
    })
    .from(S.membershipsTable)
    .innerJoin(S.usersTable, eq(S.usersTable.id, S.membershipsTable.userId))
    .where(eq(S.membershipsTable.organizationId, id));
});
endpoint("post", "/workflow/organizations/:orgId/invite", async (req, u) => {
  const id = await manager(req, u);
  const b = z
    .object({ email: z.string().email(), role: z.enum(memberRoles) })
    .parse(req.body);
  const token = randomBytes(32).toString("hex");
  await db.insert(S.invitationsTable).values({
    organizationId: id,
    email: b.email.toLowerCase(),
    role: b.role,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 7 * 86400000),
  });
  const origin = process.env.APP_ORIGIN ?? "http://localhost:25614";
  const url = `${origin}/onboarding?invite=${token}`;
  await sendEmail({
    to: b.email,
    subject: "NEOBRAIN organization invitation",
    html: `<p>You have been invited to join a NEOBRAIN organization.</p><p><a href="${url}">Accept invitation</a></p>`,
  });
  await audit(u.id, "invite_member", "organization", String(id));
  return { invitationUrl: url, expiresInDays: 7 };
});
endpoint("post", "/workflow/invitations/accept", async (req, u) => {
  const b = z.object({ token: z.string().min(32).max(100) }).parse(req.body);
  const hash = createHash("sha256").update(b.token).digest("hex");
  const [onboard] = await db
    .select()
    .from(S.userOnboardingTable)
    .where(eq(S.userOnboardingTable.userId, u.id));
  if (!onboard?.emailVerifiedAt)
    fail(403, "Verify your email before accepting an invitation");
  return db.transaction(async (tx) => {
    const [inv] = await tx
      .select()
      .from(S.invitationsTable)
      .where(
        and(
          eq(S.invitationsTable.tokenHash, hash),
          isNull(S.invitationsTable.acceptedAt),
          gt(S.invitationsTable.expiresAt, new Date()),
        ),
      )
      .for("update");
    if (!inv || inv.email !== u.email.toLowerCase())
      fail(403, "Invitation unavailable for this account");
    await tx
      .insert(S.membershipsTable)
      .values({
        organizationId: inv.organizationId,
        userId: u.id,
        role: inv.role,
      })
      .onConflictDoUpdate({
        target: [S.membershipsTable.organizationId, S.membershipsTable.userId],
        set: { role: inv.role, status: "active" },
      });
    await tx
      .update(S.invitationsTable)
      .set({ acceptedAt: new Date() })
      .where(eq(S.invitationsTable.id, inv.id));
    return { organizationId: inv.organizationId };
  });
});
endpoint(
  "post",
  "/workflow/organizations/:orgId/members/:userId/revoke",
  async (req, u) => {
    const id = await manager(req, u);
    const userId = uid.parse(req.params.userId);
    if (userId === u.id)
      fail(409, "Ask another manager to remove your membership");
    await db
      .update(S.membershipsTable)
      .set({ status: "revoked" })
      .where(
        and(
          eq(S.membershipsTable.organizationId, id),
          eq(S.membershipsTable.userId, userId),
        ),
      );
    await audit(u.id, "revoke_membership", "organization", String(id));
    return { revoked: true };
  },
);
endpoint("post", "/workflow/professional", async (req, u) => {
  const b = z
    .object({
      specialty: text,
      licenseNumber: text,
      evidence: z.string().trim().min(10).max(2000),
    })
    .parse(req.body);
  await db
    .insert(S.professionalProfilesTable)
    .values({ userId: u.id, ...b })
    .onConflictDoUpdate({
      target: S.professionalProfilesTable.userId,
      set: {
        ...b,
        verifiedAt: null,
        verifiedBy: null,
        approvalScopes: [],
        expiresAt: null,
      },
    });
  return { status: "pending_verification" };
});
endpoint("get", "/workflow/professionals", async (_req, u) => {
  if (u.role !== "superadmin") fail(403, "Platform administrator required");
  return db
    .select({
      profile: S.professionalProfilesTable,
      name: S.usersTable.name,
      email: S.usersTable.email,
    })
    .from(S.professionalProfilesTable)
    .innerJoin(
      S.usersTable,
      eq(S.usersTable.id, S.professionalProfilesTable.userId),
    );
});
endpoint("post", "/workflow/professionals/:userId/verify", async (req, u) => {
  if (u.role !== "superadmin") fail(403, "Platform administrator required");
  const id = uid.parse(req.params.userId);
  const b = z
    .object({
      scopes: z.array(z.enum(resultTypes)).min(1),
      expiresAt: z.string().datetime(),
      evidence: text,
    })
    .parse(req.body);
  if (new Date(b.expiresAt) <= new Date())
    fail(400, "Credential validity must be in the future");
  const [p] = await db
    .update(S.professionalProfilesTable)
    .set({
      verifiedAt: new Date(),
      verifiedBy: u.id,
      approvalScopes: b.scopes,
      expiresAt: new Date(b.expiresAt),
      evidence: b.evidence,
    })
    .where(eq(S.professionalProfilesTable.userId, id))
    .returning();
  if (!p) fail(404, "Professional profile unavailable");
  await audit(u.id, "verify_professional", "professional", id);
  return p;
});
endpoint("post", "/workflow/professionals/:userId/revoke", async (req, u) => {
  if (u.role !== "superadmin") fail(403, "Platform administrator required");
  const id = uid.parse(req.params.userId);
  await db
    .update(S.professionalProfilesTable)
    .set({ verifiedAt: null, approvalScopes: [] })
    .where(eq(S.professionalProfilesTable.userId, id));
  await audit(u.id, "revoke_credentials", "professional", id);
  return { revoked: true };
});
endpoint("get", "/workflow/children", async (_req, u) => {
  if (u.role !== "family") return [];
  const children = await db
    .select()
    .from(S.childrenTable)
    .where(eq(S.childrenTable.userId, u.id));
  return children.map((c) => ({
    ...c,
    riskLevel: null,
    diagnosisNotes: null,
    ageBand: ageBand(c.dateOfBirth),
  }));
});
endpoint("post", "/workflow/children", async (req, u) => {
  if (u.role !== "family") fail(403, "Guardian account required");
  const b = z
    .object({
      fullName: text,
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      gender: z.enum(["male", "female", "other"]),
      guardianAttestation: z.literal(true),
    })
    .parse(req.body);
  if (!supportedChildAge(b.dateOfBirth))
    fail(400, "Enrollment supports birth through age 12");
  const [child] = await db
    .insert(S.childrenTable)
    .values({
      fullName: b.fullName,
      dateOfBirth: b.dateOfBirth,
      gender: b.gender,
      userId: u.id,
      parentName: u.name,
      parentEmail: u.email,
    })
    .returning();
  await db
    .insert(S.userOnboardingTable)
    .values({ userId: u.id, guardianAttestedAt: new Date() })
    .onConflictDoUpdate({
      target: S.userOnboardingTable.userId,
      set: { guardianAttestedAt: new Date() },
    });
  return { ...child, riskLevel: null };
});
endpoint("get", "/workflow/cases", async (_req, u) => {
  const all = await db
    .select()
    .from(S.casesTable)
    .orderBy(desc(S.casesTable.createdAt));
  const visible = [];
  for (const c of all) {
    try {
      const a = await caseAccess(u, c.id);
      visible.push({
        ...c,
        observations:
          a.role === "guardian" || a.role === "clinician" ? c.observations : "",
        accessRole: a.role,
        clinicalAccess: a.clinical,
      });
    } catch (e) {
      if (!(e instanceof WorkflowError)) throw e;
    }
  }
  return visible;
});
endpoint("post", "/workflow/cases", async (req, u) => {
  const b = z
    .object({
      childId: positive,
      title: text,
      observations: text,
      organizationId: positive.optional(),
      consent: z.literal(true),
    })
    .parse(req.body);
  const [child] = await db
    .select()
    .from(S.childrenTable)
    .where(
      and(eq(S.childrenTable.id, b.childId), eq(S.childrenTable.userId, u.id)),
    );
  if (!child || !supportedChildAge(child.dateOfBirth))
    fail(400, "Eligible child required");
  if (b.organizationId) {
    const [org] = await db
      .select()
      .from(S.organizationsTable)
      .where(
        and(
          eq(S.organizationsTable.id, b.organizationId),
          eq(S.organizationsTable.status, "active"),
        ),
      );
    if (!org) fail(400, "Participating organization required");
  }
  const [record] = await db
    .insert(S.casesTable)
    .values({
      ownerId: u.id,
      childId: b.childId,
      title: b.title,
      observations: b.observations,
      organizationId: b.organizationId,
      consentAt: new Date(),
    })
    .returning();
  await audit(u.id, "submit_case", "case", String(record.id));
  return record;
});
endpoint("get", "/workflow/directory", async () =>
  db
    .select({
      id: S.organizationsTable.id,
      name: S.organizationsTable.name,
      type: S.organizationsTable.type,
      region: S.organizationsTable.region,
    })
    .from(S.organizationsTable)
    .where(eq(S.organizationsTable.status, "active")),
);
endpoint("get", "/workflow/cases/:caseId", async (req, u) => {
  const a = await caseAccess(u, ident(req.params.caseId));
  const id = a.record.id;
  const owner = a.role === "guardian";
  const [child] = await db
    .select()
    .from(S.childrenTable)
    .where(eq(S.childrenTable.id, a.record.childId));
  const reviewer = a.role === "clinician" && a.clinical;
  const results = await db
    .select()
    .from(S.caseResultsTable)
    .where(eq(S.caseResultsTable.caseId, id))
    .orderBy(desc(S.caseResultsTable.createdAt));
  const tasks = await db
    .select()
    .from(S.caseTasksTable)
    .where(eq(S.caseTasksTable.caseId, id))
    .orderBy(desc(S.caseTasksTable.createdAt));
  const entries = await db
    .select()
    .from(S.caseEntriesTable)
    .where(eq(S.caseEntriesTable.caseId, id))
    .orderBy(desc(S.caseEntriesTable.createdAt));
  const attachments = await db
    .select({
      id: S.attachmentsTable.id,
      name: S.attachmentsTable.name,
      mimeType: S.attachmentsTable.mimeType,
      size: S.attachmentsTable.size,
      createdAt: S.attachmentsTable.createdAt,
    })
    .from(S.attachmentsTable)
    .where(eq(S.attachmentsTable.caseId, id));
  const referrals = await db
    .select()
    .from(S.referralsTable)
    .where(eq(S.referralsTable.caseId, id));
  const bookings = await db
    .select({ booking: S.bookingsTable, slot: S.availabilitySlotsTable })
    .from(S.bookingsTable)
    .innerJoin(
      S.availabilitySlotsTable,
      eq(S.availabilitySlotsTable.id, S.bookingsTable.slotId),
    )
    .where(eq(S.bookingsTable.caseId, id));
  const grants = owner
    ? await db
        .select({
          grant: S.accessGrantsTable,
          name: S.usersTable.name,
          email: S.usersTable.email,
        })
        .from(S.accessGrantsTable)
        .innerJoin(
          S.usersTable,
          eq(S.usersTable.id, S.accessGrantsTable.userId),
        )
        .where(eq(S.accessGrantsTable.caseId, id))
    : [];
  return {
    ...a.record,
    child: child
      ? {
          id: child.id,
          fullName: child.fullName,
          ageBand: ageBand(child.dateOfBirth),
          ageMonths: ageMonths(child.dateOfBirth),
          ...(owner || reviewer
            ? { dateOfBirth: child.dateOfBirth, gender: child.gender }
            : {}),
        }
      : null,
    accessRole: a.role,
    clinicalAccess: a.clinical,
    observations: ["guardian", "clinician", "coordinator"].includes(a.role)
      ? a.record.observations
      : "",
    results: reviewer
      ? results.filter((r) => r.status === "approved" || r.authorId === u.id)
      : a.clinical
        ? results.filter((r) => r.status === "approved")
        : [],
    tasks: tasks.filter(
      (t) =>
        (t.kind !== "worknote" || (reviewer && t.authorId === u.id)) &&
        (t.kind !== "support_plan" || a.clinical),
    ),
    entries: entries.filter((e) => a.role !== "school" || e.authorId === u.id),
    attachments: owner || reviewer ? attachments : [],
    referrals: referrals.map((r) => ({
      ...r,
      reason: a.clinical ? r.reason : "Approved referral",
      outcome: a.clinical ? r.outcome : null,
    })),
    bookings: bookings.map(({ booking, slot }) => ({
      ...booking,
      meetingUrl:
        owner || booking.providerId === u.id ? booking.meetingUrl : null,
      currentLocation:
        owner || booking.providerId === u.id ? booking.currentLocation : null,
      callbackPhone:
        owner || booking.providerId === u.id ? booking.callbackPhone : null,
      startsAt: slot.startsAt,
      mode: slot.mode,
    })),
    grants,
  };
});
endpoint("post", "/workflow/cases/:caseId/consent", async (req, u) => {
  const a = await caseAccess(u, ident(req.params.caseId));
  if (a.role !== "guardian") fail(403, "Guardian required");
  const b = z.object({ withdraw: z.boolean() }).parse(req.body);
  await db
    .update(S.casesTable)
    .set({ consentWithdrawnAt: b.withdraw ? new Date() : null })
    .where(eq(S.casesTable.id, a.record.id));
  await audit(
    u.id,
    b.withdraw ? "withdraw_consent" : "restore_consent",
    "case",
    String(a.record.id),
  );
  return { withdrawn: b.withdraw };
});
endpoint("post", "/workflow/cases/:caseId/share", async (req, u) => {
  const a = await caseAccess(u, ident(req.params.caseId));
  if (a.role !== "guardian") fail(403, "Guardian required");
  const b = z
    .object({
      email: z.string().email(),
      role: z.enum(["school", "frontliner", "clinician"]),
      shareClinical: z.boolean().default(false),
    })
    .parse(req.body);
  const [target] = await db
    .select()
    .from(S.usersTable)
    .where(eq(S.usersTable.email, b.email.toLowerCase()));
  if (!target) fail(404, "Ask the recipient to create an account first");
  if (b.role === "clinician") await verifiedProfessional(target.id);
  const affiliations = await db
    .select({ member: S.membershipsTable, org: S.organizationsTable })
    .from(S.membershipsTable)
    .innerJoin(
      S.organizationsTable,
      eq(S.organizationsTable.id, S.membershipsTable.organizationId),
    )
    .where(
      and(
        eq(S.membershipsTable.userId, target.id),
        eq(S.membershipsTable.status, "active"),
        eq(S.organizationsTable.status, "active"),
      ),
    );
  const expectedRole = b.role === "school" ? "teacher" : b.role;
  if (!affiliations.some((row) => row.member.role === expectedRole))
    fail(
      403,
      "Recipient requires an active organization affiliation for this role",
    );
  await db
    .insert(S.accessGrantsTable)
    .values({
      caseId: a.record.id,
      userId: target.id,
      role: b.role,
      shareClinical: b.shareClinical,
    })
    .onConflictDoUpdate({
      target: [S.accessGrantsTable.caseId, S.accessGrantsTable.userId],
      set: { role: b.role, shareClinical: b.shareClinical, revokedAt: null },
    });
  await audit(u.id, "share_case", "case", String(a.record.id));
  await notify(target.id, "A case has been shared with you", a.record.id);
  return { shared: true };
});
endpoint(
  "post",
  "/workflow/cases/:caseId/share/:userId/revoke",
  async (req, u) => {
    const a = await caseAccess(u, ident(req.params.caseId));
    if (a.role !== "guardian") fail(403, "Guardian required");
    await db
      .update(S.accessGrantsTable)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(S.accessGrantsTable.caseId, a.record.id),
          eq(S.accessGrantsTable.userId, uid.parse(req.params.userId)),
        ),
      );
    await audit(u.id, "revoke_case_access", "case", String(a.record.id));
    return { revoked: true };
  },
);
endpoint(
  "get",
  "/workflow/cases/:caseId/eligible-reviewers",
  async (req, u) => {
    const a = await caseAccess(u, ident(req.params.caseId));
    if (!["routing", "coordinator"].includes(a.role))
      fail(403, "Coordinator access required");
    if (!a.record.organizationId) return [];
    return db
      .select({
        id: S.usersTable.id,
        name: S.usersTable.name,
        specialty: S.professionalProfilesTable.specialty,
        scopes: S.professionalProfilesTable.approvalScopes,
      })
      .from(S.membershipsTable)
      .innerJoin(S.usersTable, eq(S.usersTable.id, S.membershipsTable.userId))
      .innerJoin(
        S.professionalProfilesTable,
        eq(S.professionalProfilesTable.userId, S.usersTable.id),
      )
      .where(
        and(
          eq(S.membershipsTable.organizationId, a.record.organizationId),
          eq(S.membershipsTable.role, "clinician"),
          eq(S.membershipsTable.status, "active"),
          isNotNull(S.professionalProfilesTable.verifiedAt),
          gt(S.professionalProfilesTable.expiresAt, new Date()),
        ),
      );
  },
);
endpoint("post", "/workflow/cases/:caseId/assign", async (req, u) => {
  const a = await caseAccess(u, ident(req.params.caseId));
  if (!["routing", "coordinator"].includes(a.role))
    fail(403, "Coordinator access required");
  const b = z
    .object({ reviewerId: uid, coordinatorId: uid.optional() })
    .parse(req.body);
  await verifiedProfessional(b.reviewerId, "developmental_review");
  if (!a.record.organizationId)
    fail(400, "Family must select a participating organization");
  const m = await membership(b.reviewerId, a.record.organizationId);
  if (m?.role !== "clinician")
    fail(403, "Reviewer must belong to the responsible organization");
  if (b.coordinatorId) {
    const cm = await membership(b.coordinatorId, a.record.organizationId);
    if (!cm || !["coordinator", "manager"].includes(cm.role))
      fail(400, "Eligible coordinator required");
  }
  await db
    .update(S.casesTable)
    .set({
      reviewerId: b.reviewerId,
      coordinatorId: b.coordinatorId ?? u.id,
      status: "assigned",
    })
    .where(eq(S.casesTable.id, a.record.id));
  await audit(u.id, "assign_review", "case", String(a.record.id));
  await notify(
    b.reviewerId,
    "A clinical review is awaiting your acceptance",
    a.record.id,
  );
  return { assigned: true };
});
endpoint("post", "/workflow/cases/:caseId/accept", async (req, u) => {
  const a = await caseAccess(u, ident(req.params.caseId));
  if (a.record.reviewerId !== u.id || a.record.status !== "assigned")
    fail(409, "Assigned review required");
  await verifiedProfessional(u.id, "developmental_review");
  await db
    .update(S.casesTable)
    .set({ status: "in_review" })
    .where(eq(S.casesTable.id, a.record.id));
  return { status: "in_review" };
});
endpoint("post", "/workflow/cases/:caseId/decline", async (req, u) => {
  const a = await caseAccess(u, ident(req.params.caseId));
  if (a.record.reviewerId !== u.id) fail(403, "Assigned reviewer required");
  if (!["assigned", "in_review"].includes(a.record.status))
    fail(409, "Only an active assignment can be declined");
  await db
    .update(S.casesTable)
    .set({ reviewerId: null, status: "submitted" })
    .where(eq(S.casesTable.id, a.record.id));
  if (a.record.coordinatorId)
    await notify(
      a.record.coordinatorId,
      "A review assignment was declined; reassignment is required",
      a.record.id,
    );
  return { status: "submitted" };
});
endpoint("post", "/workflow/cases/:caseId/entries", async (req, u) => {
  const a = await caseAccess(u, ident(req.params.caseId));
  if (a.role === "routing") fail(403, "Explicit case assignment required");
  const b = z
    .object({
      kind: z.enum([
        "home_observation",
        "school_observation",
        "history",
        "nutrition",
        "milestone",
        "message",
        "support_progress",
      ]),
      content: text,
      context: z.record(z.string(), z.unknown()).optional(),
    })
    .parse(req.body);
  if (
    a.role === "school" &&
    !["school_observation", "support_progress", "message"].includes(b.kind)
  )
    fail(403, "School observation scope required");
  const [entry] = await db
    .insert(S.caseEntriesTable)
    .values({ caseId: a.record.id, authorId: u.id, ...b })
    .returning();
  return entry;
});
endpoint("post", "/workflow/cases/:caseId/results", async (req, u) => {
  const a = await caseAccess(u, ident(req.params.caseId));
  if (a.role !== "clinician" || !a.clinical)
    fail(403, "Clinical case access required");
  const b = z
    .object({ content: text, resultType: z.enum(resultTypes) })
    .parse(req.body);
  await verifiedProfessional(u.id, b.resultType);
  if (
    a.record.reviewerId === u.id &&
    !["in_review", "reviewed"].includes(a.record.status)
  )
    fail(409, "Accept the assignment first");
  const [result] = await db
    .insert(S.caseResultsTable)
    .values({ caseId: a.record.id, authorId: u.id, ...b })
    .returning();
  return result;
});
endpoint(
  "post",
  "/workflow/cases/:caseId/results/:resultId/decision",
  async (req, u) => {
    const a = await caseAccess(u, ident(req.params.caseId));
    if (a.role !== "clinician" || !a.clinical)
      fail(403, "Assigned clinical access required");
    const b = z
      .object({ decision: z.enum(["approved", "rejected", "returned"]) })
      .parse(req.body);
    const resultId = ident(req.params.resultId);
    const result = await db.transaction(async (tx) => {
      const [draft] = await tx
        .select()
        .from(S.caseResultsTable)
        .where(
          and(
            eq(S.caseResultsTable.id, resultId),
            eq(S.caseResultsTable.caseId, a.record.id),
          ),
        )
        .for("update");
      if (!draft || draft.status !== "draft" || draft.authorId !== u.id)
        fail(409, "Your unapproved draft is required");
      await verifiedProfessional(u.id, draft.resultType, tx);
      const [r] = await tx
        .update(S.caseResultsTable)
        .set({
          status: b.decision,
          approvedBy: b.decision === "approved" ? u.id : null,
          approvedAt: b.decision === "approved" ? new Date() : null,
        })
        .where(eq(S.caseResultsTable.id, resultId))
        .returning();
      if (b.decision === "approved")
        await tx
          .update(S.casesTable)
          .set({ status: "reviewed" })
          .where(eq(S.casesTable.id, a.record.id));
      await tx.insert(S.auditLogsTable).values({
        userId: u.id,
        action: `clinical_result_${b.decision}`,
        resourceType: "case_result_version",
        resourceId: String(resultId),
      });
      return r;
    });
    if (b.decision === "approved")
      await notify(
        a.record.ownerId,
        "A clinician-approved result is available",
        a.record.id,
      );
    return result;
  },
);
endpoint("post", "/workflow/cases/:caseId/tasks", async (req, u) => {
  const a = await caseAccess(u, ident(req.params.caseId));
  if (!["clinician", "coordinator"].includes(a.role))
    fail(403, "Assigned care team required");
  const b = z
    .object({
      kind: z.enum([
        "worknote",
        "information_request",
        "follow_up",
        "support_plan",
      ]),
      content: text,
      assignedTo: uid.optional(),
      dueAt: z.string().datetime().optional(),
      approveClinicalPlan: z.boolean().optional(),
    })
    .parse(req.body);
  if (["worknote", "support_plan"].includes(b.kind)) {
    if (a.role !== "clinician" || !a.clinical) fail(403, "Clinician required");
    await verifiedProfessional(u.id, "developmental_review");
  }
  if (b.kind === "support_plan" && b.approveClinicalPlan !== true)
    fail(409, "Clinician approval is required before releasing a support plan");
  const [t] = await db
    .insert(S.caseTasksTable)
    .values({
      caseId: a.record.id,
      authorId: u.id,
      kind: b.kind,
      content: b.content,
      metadata: {
        assignedTo:
          b.kind === "worknote" ? u.id : (b.assignedTo ?? a.record.ownerId),
        dueAt: b.dueAt ?? null,
        ...(b.kind === "support_plan"
          ? { approvedBy: u.id, approvedAt: new Date().toISOString() }
          : {}),
      },
    })
    .returning();
  if (b.kind === "support_plan")
    await audit(u.id, "approve_support_plan", "case_task", String(t.id));
  if (b.kind !== "worknote")
    await notify(
      b.assignedTo ?? a.record.ownerId,
      "A new case task is available",
      a.record.id,
    );
  return t;
});
endpoint(
  "post",
  "/workflow/cases/:caseId/tasks/:taskId/complete",
  async (req, u) => {
    const a = await caseAccess(u, ident(req.params.caseId));
    const [task] = await db
      .select()
      .from(S.caseTasksTable)
      .where(
        and(
          eq(S.caseTasksTable.id, ident(req.params.taskId)),
          eq(S.caseTasksTable.caseId, a.record.id),
        ),
      );
    if (!task) fail(404, "Task unavailable");
    if (task.kind === "worknote" && a.role !== "clinician")
      fail(403, "Clinical worknote access required");
    const meta = task.metadata as { assignedTo?: string } | null;
    if (task.authorId !== u.id && meta?.assignedTo !== u.id)
      fail(403, "Task assignee required");
    await db
      .update(S.caseTasksTable)
      .set({ status: "completed" })
      .where(eq(S.caseTasksTable.id, task.id));
    return { completed: true };
  },
);
endpoint("get", "/workflow/notifications", async (_req, u) =>
  db
    .select()
    .from(S.notificationsV2Table)
    .where(eq(S.notificationsV2Table.userId, u.id))
    .orderBy(desc(S.notificationsV2Table.createdAt))
    .limit(100),
);
endpoint("post", "/workflow/notifications/:id/read", async (req, u) => {
  await db
    .update(S.notificationsV2Table)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(S.notificationsV2Table.id, ident(req.params.id)),
        eq(S.notificationsV2Table.userId, u.id),
      ),
    );
  return { read: true };
});
export { endpoint, router, ident, text, uid };
