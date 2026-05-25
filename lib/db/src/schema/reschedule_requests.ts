import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rescheduleRequestsTable = pgTable("reschedule_requests", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull(),
  requestedByRole: text("requested_by_role").notNull(),
  proposedAt: timestamp("proposed_at", { withTimezone: true }).notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRescheduleRequestSchema = createInsertSchema(rescheduleRequestsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertRescheduleRequest = z.infer<typeof insertRescheduleRequestSchema>;
export type RescheduleRequest = typeof rescheduleRequestsTable.$inferSelect;
