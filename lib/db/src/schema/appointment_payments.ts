import { pgTable, text, serial, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentPaymentsTable = pgTable("appointment_payments", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("PHP"),
  status: text("status").notNull().default("pending"),
  transactionRef: text("transaction_ref"),
  paymentMethod: text("payment_method"),
  referenceNumber: text("reference_number"),
  proofImageBase64: text("proof_image_base64"),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAppointmentPaymentSchema = createInsertSchema(appointmentPaymentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAppointmentPayment = z.infer<typeof insertAppointmentPaymentSchema>;
export type AppointmentPayment = typeof appointmentPaymentsTable.$inferSelect;
