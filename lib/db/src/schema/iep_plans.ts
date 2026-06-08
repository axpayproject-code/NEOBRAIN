import { pgTable, text, serial, integer, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const iepPlansTable = pgTable("iep_plans", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  schoolUserId: uuid("school_user_id").notNull(),
  coordinatorName: text("coordinator_name").notNull(),
  schoolName: text("school_name"),
  gradeLevel: text("grade_level"),
  academicYear: text("academic_year").notNull(),
  exceptionality: text("exceptionality"),
  disabilities: text("disabilities"),
  presentLevelOfPerformance: text("present_level_of_performance"),
  annualGoals: jsonb("annual_goals"),
  shortTermObjectives: jsonb("short_term_objectives"),
  specialServices: jsonb("special_services"),
  accommodations: jsonb("accommodations"),
  modifications: jsonb("modifications"),
  participationInRegularClass: text("participation_in_regular_class"),
  assessmentAccommodations: text("assessment_accommodations"),
  transitionServices: text("transition_services"),
  parentInvolvement: text("parent_involvement"),
  reviewDate: timestamp("review_date", { withTimezone: true }),
  implementationDate: timestamp("implementation_date", { withTimezone: true }),
  expirationDate: timestamp("expiration_date", { withTimezone: true }),
  progressNotes: jsonb("progress_notes"),
  status: text("status").notNull().default("draft"),
  parentConsentGiven: boolean("parent_consent_given").notNull().default(false),
  parentConsentDate: timestamp("parent_consent_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIepPlanSchema = createInsertSchema(iepPlansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIepPlan = z.infer<typeof insertIepPlanSchema>;
export type IepPlan = typeof iepPlansTable.$inferSelect;
