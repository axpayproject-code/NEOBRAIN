import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("parent"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  subscriptionStatus: text("subscription_status").notNull().default("active"),
  subscriptionPaidUntil: timestamp("subscription_paid_until", { withTimezone: true }),
  subscriptionRef: text("subscription_ref"),
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }),
  trialExpiresAt: timestamp("trial_expires_at", { withTimezone: true }),
  trialUsed: boolean("trial_used").notNull().default(false),
  orgName: text("org_name"),
  region: text("region"),
  phone: text("phone"),
  paymentProofUrl: text("payment_proof_url"),
  requestedPlan: text("requested_plan"),
  requestedBillingCycle: text("requested_billing_cycle"),
});

export type User = typeof usersTable.$inferSelect;
