import { pgTable, text, serial, integer, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const soapNotesTable = pgTable("soap_notes", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  appointmentId: integer("appointment_id"),
  clinicUserId: uuid("clinic_user_id").notNull(),
  clinicianName: text("clinician_name").notNull(),
  clinicianRole: text("clinician_role"),
  visitDate: timestamp("visit_date", { withTimezone: true }).notNull().defaultNow(),
  subjective: text("subjective"),
  objective: text("objective"),
  assessment: text("assessment"),
  plan: text("plan"),
  diagnosisCodes: text("diagnosis_codes"),
  vitalSigns: jsonb("vital_signs"),
  followUpDate: timestamp("follow_up_date", { withTimezone: true }),
  followUpNotes: text("follow_up_notes"),
  isFinalized: text("is_finalized").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSoapNoteSchema = createInsertSchema(soapNotesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSoapNote = z.infer<typeof insertSoapNoteSchema>;
export type SoapNote = typeof soapNotesTable.$inferSelect;
