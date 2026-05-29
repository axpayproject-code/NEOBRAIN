import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const therapySessionNotesTable = pgTable("therapy_session_notes", {
  id: serial("id").primaryKey(),
  therapyPlanId: integer("therapy_plan_id").notNull(),
  childId: integer("child_id").notNull(),
  sessionNumber: integer("session_number").notNull(),
  sessionDate: timestamp("session_date", { withTimezone: true }).notNull(),
  therapistName: text("therapist_name"),
  sessionType: text("session_type").notNull().default("in-person"),
  durationMinutes: integer("duration_minutes"),
  goalsAddressed: text("goals_addressed"),
  activitiesPerformed: text("activities_performed"),
  childResponse: text("child_response"),
  progressObserved: text("progress_observed"),
  challenges: text("challenges"),
  parentFeedback: text("parent_feedback"),
  nextSessionPlan: text("next_session_plan"),
  overallRating: integer("overall_rating"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTherapySessionNoteSchema = createInsertSchema(therapySessionNotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTherapySessionNote = z.infer<typeof insertTherapySessionNoteSchema>;
export type TherapySessionNote = typeof therapySessionNotesTable.$inferSelect;
