import { pgTable, text, serial, timestamp, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  specialistName: text("specialist_name").notNull(),
  specialistType: text("specialist_type").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  status: text("status").notNull().default("scheduled"),
  telehealth: boolean("telehealth").default(false),
  meetingUrl: text("meeting_url"),
  notes: text("notes"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  feeAmount: doublePrecision("fee_amount"),
  location: text("location"),
  regionId: text("region_id"),
  province: text("province"),
  paymentRef: text("payment_ref"),
  paymentProofUrl: text("payment_proof_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
