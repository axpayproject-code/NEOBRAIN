import { pgTable, text, serial, integer, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const teacherObservationsTable = pgTable("teacher_observations", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  classId: integer("class_id"),
  schoolUserId: uuid("school_user_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  observationDate: timestamp("observation_date", { withTimezone: true }).notNull().defaultNow(),
  setting: text("setting").notNull().default("classroom"),
  duration: integer("duration_minutes"),
  academicPerformance: text("academic_performance"),
  socialInteraction: text("social_interaction"),
  attentionFocus: text("attention_focus"),
  behaviorConcerns: text("behavior_concerns"),
  languageCommunication: text("language_communication"),
  motorSkills: text("motor_skills"),
  emotionalRegulation: text("emotional_regulation"),
  strengths: text("strengths"),
  areasOfConcern: text("areas_of_concern"),
  recommendedActions: text("recommended_actions"),
  parentNotified: boolean("parent_notified").notNull().default(false),
  followUpRequired: boolean("follow_up_required").notNull().default(false),
  domainRatings: jsonb("domain_ratings"),
  attachments: jsonb("attachments"),
  status: text("status").notNull().default("submitted"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertObservationSchema = createInsertSchema(teacherObservationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertObservation = z.infer<typeof insertObservationSchema>;
export type TeacherObservation = typeof teacherObservationsTable.$inferSelect;
