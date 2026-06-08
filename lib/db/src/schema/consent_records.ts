import { pgTable, text, uuid, timestamp, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const consentRecordsTable = pgTable("consent_records", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  childId: text("child_id"),
  category: text("category").notNull(),
  version: text("version").notNull().default("1.0"),
  granted: boolean("granted").notNull().default(false),
  grantedAt: timestamp("granted_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ipAddress: text("ip_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertConsentSchema = createInsertSchema(consentRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConsent = z.infer<typeof insertConsentSchema>;
export type ConsentRecord = typeof consentRecordsTable.$inferSelect;
