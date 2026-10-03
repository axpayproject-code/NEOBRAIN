import {
  pgTable,
  uuid,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { casesTable, caseResultsTable } from "./case_workflow";
import { childrenTable } from "./children";
const time = (name: string) => timestamp(name, { withTimezone: true });
export const organizationsTable = pgTable("care_organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  region: text("region"),
  status: text("status").notNull().default("pending"),
  billingEmail: text("billing_email").notNull(),
  subscriptionPaidUntil: time("subscription_paid_until"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => usersTable.id),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const membershipsTable = pgTable(
  "care_memberships",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizationsTable.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
  },
  (t) => [uniqueIndex("care_membership_unique").on(t.organizationId, t.userId)],
);
export const invitationsTable = pgTable("care_invitations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  email: text("email").notNull(),
  role: text("role").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: time("expires_at").notNull(),
  acceptedAt: time("accepted_at"),
});
export const accessGrantsTable = pgTable(
  "case_access_grants",
  {
    id: serial("id").primaryKey(),
    caseId: integer("case_id")
      .notNull()
      .references(() => casesTable.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    role: text("role").notNull(),
    shareClinical: boolean("share_clinical").notNull().default(false),
    revokedAt: time("revoked_at"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("case_access_unique").on(t.caseId, t.userId)],
);
export const caseEntriesTable = pgTable("case_entries", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => casesTable.id),
  authorId: uuid("author_id")
    .notNull()
    .references(() => usersTable.id),
  kind: text("kind").notNull(),
  content: text("content").notNull(),
  context: jsonb("context"),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const referralsTable = pgTable("care_referrals", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => casesTable.id),
  resultId: integer("result_id")
    .notNull()
    .references(() => caseResultsTable.id),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => usersTable.id),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("sent"),
  outcome: text("outcome"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => usersTable.id),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const availabilitySlotsTable = pgTable("care_availability_slots", {
  id: serial("id").primaryKey(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => usersTable.id),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  startsAt: time("starts_at").notNull(),
  endsAt: time("ends_at").notNull(),
  mode: text("mode").notNull(),
  feeCentavos: integer("fee_centavos").notNull(),
  cancellationPolicy: text("cancellation_policy").notNull(),
  location: text("location"),
  status: text("status").notNull().default("available"),
});
export const bookingsTable = pgTable("care_bookings", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => casesTable.id),
  referralId: integer("referral_id").references(() => referralsTable.id),
  slotId: integer("slot_id")
    .notNull()
    .references(() => availabilitySlotsTable.id),
  guardianId: uuid("guardian_id")
    .notNull()
    .references(() => usersTable.id),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => usersTable.id),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  status: text("status").notNull().default("payment_pending"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  amountCentavos: integer("amount_centavos").notNull(),
  meetingUrl: text("meeting_url"),
  location: text("location"),
  callbackPhone: text("callback_phone"),
  currentLocation: text("current_location"),
  holdExpiresAt: time("hold_expires_at"),
  sponsorProgramId: integer("sponsor_program_id"),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const encountersTable = pgTable("care_encounters", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .unique()
    .references(() => bookingsTable.id),
  caseId: integer("case_id")
    .notNull()
    .references(() => casesTable.id),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => usersTable.id),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("draft"),
  approvedAt: time("approved_at"),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const ordersTable = pgTable("care_payment_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: integer("booking_id")
    .unique()
    .references(() => bookingsTable.id),
  payerId: uuid("payer_id")
    .notNull()
    .references(() => usersTable.id),
  organizationId: integer("organization_id").references(
    () => organizationsTable.id,
  ),
  kind: text("kind").notNull().default("appointment"),
  amountCentavos: integer("amount_centavos").notNull(),
  status: text("status").notNull().default("pending"),
  checkoutId: text("checkout_id").unique(),
  checkoutUrl: text("checkout_url"),
  paymentId: text("payment_id"),
  refundId: text("refund_id"),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const paymentEventsTable = pgTable("care_payment_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: time("received_at").notNull().defaultNow(),
});
export const attachmentsTable = pgTable("care_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: integer("case_id")
    .notNull()
    .references(() => casesTable.id),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => usersTable.id),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  storageKey: text("storage_key").notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const notificationsV2Table = pgTable("care_notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  message: text("message").notNull(),
  caseId: integer("case_id").references(() => casesTable.id),
  readAt: time("read_at"),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const userOnboardingTable = pgTable("care_user_onboarding", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => usersTable.id),
  emailVerifiedAt: time("email_verified_at"),
  trainingCompletedAt: time("training_completed_at"),
  guardianAttestedAt: time("guardian_attested_at"),
});
export const programsV2Table = pgTable("care_programs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  name: text("name").notNull(),
  budgetCentavos: integer("budget_centavos").notNull().default(0),
  spentCentavos: integer("spent_centavos").notNull().default(0),
  status: text("status").notNull().default("active"),
});
export const resourcesV2Table = pgTable("care_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  minAgeMonths: integer("min_age_months").notNull(),
  maxAgeMonths: integer("max_age_months").notNull(),
  status: text("status").notNull().default("draft"),
  approvedBy: uuid("approved_by").references(() => usersTable.id),
});
