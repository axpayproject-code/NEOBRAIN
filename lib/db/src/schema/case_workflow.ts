import {
  pgTable,
  uuid,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { childrenTable } from "./children";
export const sessionsTable = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const professionalProfilesTable = pgTable("professional_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => usersTable.id),
  specialty: text("specialty").notNull(),
  approvalScopes: jsonb("approval_scopes").$type<string[]>().notNull().default([]),
  expiresAt: timestamp("expires_at", {withTimezone:true}),
  evidence: text("evidence"),
  licenseNumber: text("license_number").notNull(),
  verifiedBy: uuid("verified_by").references(() => usersTable.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
});
export const casesTable = pgTable("developmental_cases", {
  id: serial("id").primaryKey(),
  childId: integer("child_id")
    .notNull()
    .references(() => childrenTable.id),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => usersTable.id),
  reviewerId: uuid("reviewer_id").references(() => usersTable.id),
  organizationId: integer("organization_id"),
  coordinatorId: uuid("coordinator_id").references(()=>usersTable.id),
  consentWithdrawnAt: timestamp("consent_withdrawn_at", {withTimezone:true}),
  title: text("title").notNull(),
  observations: text("observations").notNull(),
  status: text("status").notNull().default("submitted"),
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const caseResultsTable = pgTable("case_result_versions", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => casesTable.id),
  authorId: uuid("author_id")
    .notNull()
    .references(() => usersTable.id),
  resultType: text("result_type").notNull().default("developmental_review"),
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"),
  approvedBy: uuid("approved_by").references(() => usersTable.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const caseTasksTable = pgTable("case_tasks", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => casesTable.id),
  authorId: uuid("author_id")
    .notNull()
    .references(() => usersTable.id),
  kind: text("kind").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("open"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
