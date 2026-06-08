import { pgTable, text, serial, integer, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const intakeFormsTable = pgTable("intake_forms", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  clinicUserId: uuid("clinic_user_id").notNull(),
  chiefComplaint: text("chief_complaint"),
  presentingConcerns: text("presenting_concerns"),
  developmentalHistory: text("developmental_history"),
  birthHistory: text("birth_history"),
  medicalHistory: text("medical_history"),
  familyHistory: text("family_history"),
  socialHistory: text("social_history"),
  previousInterventions: text("previous_interventions"),
  currentMedications: text("current_medications"),
  allergies: text("allergies"),
  immunizationStatus: text("immunization_status"),
  schoolPerformance: text("school_performance"),
  behaviorAtHome: text("behavior_at_home"),
  parentConcerns: text("parent_concerns"),
  clinicianObservations: text("clinician_observations"),
  preliminaryFindings: jsonb("preliminary_findings"),
  triageLevel: text("triage_level").notNull().default("routine"),
  status: text("status").notNull().default("draft"),
  isComplete: boolean("is_complete").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIntakeFormSchema = createInsertSchema(intakeFormsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIntakeForm = z.infer<typeof insertIntakeFormSchema>;
export type IntakeForm = typeof intakeFormsTable.$inferSelect;
