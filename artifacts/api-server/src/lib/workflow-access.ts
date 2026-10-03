import { and, eq, isNull } from "drizzle-orm";
import {
  db,
  casesTable,
  accessGrantsTable,
  membershipsTable,
  organizationsTable,
  professionalProfilesTable,
  auditLogsTable,
  notificationsV2Table,
} from "@workspace/db";
export class WorkflowError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function fail(status: number, message: string): never {
  throw new WorkflowError(status, message);
}
type Executor = Pick<typeof db, "select">;
export async function membership(
  userId: string,
  organizationId: number,
  executor: Executor = db,
) {
  const [row] = await executor
    .select({ member: membershipsTable, organization: organizationsTable })
    .from(membershipsTable)
    .innerJoin(
      organizationsTable,
      eq(organizationsTable.id, membershipsTable.organizationId),
    )
    .where(
      and(
        eq(membershipsTable.userId, userId),
        eq(membershipsTable.organizationId, organizationId),
        eq(membershipsTable.status, "active"),
      ),
    );
  return row?.organization.status === "active" ? row.member : null;
}
export async function manageOrganization(
  user: { id: string; role: string },
  id: number,
) {
  if (user.role === "superadmin") return true;
  const m = await membership(user.id, id);
  if (m?.role !== "manager") fail(403, "Organization manager access required");
  return true;
}
export async function caseAccess(
  user: { id: string; role: string },
  id: number,
  executor: Executor = db,
) {
  const [record] = await executor
    .select()
    .from(casesTable)
    .where(eq(casesTable.id, id));
  if (!record) fail(404, "Case unavailable");
  if (record.ownerId === user.id)
    return { record, role: "guardian", clinical: true };
  if (record.consentWithdrawnAt)
    fail(403, "Case sharing consent has been withdrawn");
  const assignedMembership = record.organizationId
    ? await membership(user.id, record.organizationId, executor)
    : null;
  if (
    record.reviewerId === user.id &&
    assignedMembership?.role === "clinician"
  ) {
    await verifiedProfessional(user.id, undefined, executor);
    return { record, role: "clinician", clinical: true };
  }
  if (
    record.coordinatorId === user.id &&
    assignedMembership &&
    ["coordinator", "manager"].includes(assignedMembership.role)
  )
    return { record, role: "coordinator", clinical: false };
  const [grant] = await executor
    .select()
    .from(accessGrantsTable)
    .where(
      and(
        eq(accessGrantsTable.caseId, id),
        eq(accessGrantsTable.userId, user.id),
        isNull(accessGrantsTable.revokedAt),
      ),
    );
  if (grant) {
    const expectedRole = grant.role === "school" ? "teacher" : grant.role;
    const activeAffiliations = await executor
      .select({ member: membershipsTable, org: organizationsTable })
      .from(membershipsTable)
      .innerJoin(
        organizationsTable,
        eq(organizationsTable.id, membershipsTable.organizationId),
      )
      .where(
        and(
          eq(membershipsTable.userId, user.id),
          eq(membershipsTable.status, "active"),
          eq(organizationsTable.status, "active"),
        ),
      );
    if (!activeAffiliations.some((a) => a.member.role === expectedRole))
      fail(403, "Active organization affiliation required");
    if (grant.role === "clinician")
      await verifiedProfessional(user.id, undefined, executor);
    return { record, role: grant.role, clinical: grant.shareClinical };
  }
  const m = record.organizationId
    ? await membership(user.id, record.organizationId, executor)
    : null;
  if (
    user.role === "superadmin" ||
    m?.role === "manager" ||
    m?.role === "coordinator"
  )
    return { record, role: "routing", clinical: false };
  fail(404, "Case unavailable");
}
export async function verifiedProfessional(
  id: string,
  scope?: string,
  executor: Executor = db,
) {
  const [p] = await executor
    .select()
    .from(professionalProfilesTable)
    .where(eq(professionalProfilesTable.userId, id));
  if (!p?.verifiedAt || !p.expiresAt || p.expiresAt < new Date())
    fail(403, "Current verified professional credentials required");
  if (scope && !p.approvalScopes.includes(scope))
    fail(403, "This result type is outside your verified approval scope");
  return p;
}
export async function audit(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
) {
  await db
    .insert(auditLogsTable)
    .values({ userId, action, resourceType, resourceId });
}
export async function notify(userId: string, message: string, caseId?: number) {
  await db.insert(notificationsV2Table).values({ userId, message, caseId });
}
