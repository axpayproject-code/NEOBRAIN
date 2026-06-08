import { pgTable, text, serial, integer, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const schoolClassesTable = pgTable("school_classes", {
  id: serial("id").primaryKey(),
  schoolUserId: uuid("school_user_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  className: text("class_name").notNull(),
  gradeLevel: text("grade_level").notNull(),
  section: text("section"),
  schoolYear: text("school_year").notNull(),
  schoolName: text("school_name"),
  campusName: text("campus_name"),
  room: text("room"),
  schedule: text("schedule"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const classEnrollmentsTable = pgTable("class_enrollments", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  childId: integer("child_id").notNull(),
  childName: text("child_name").notNull(),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClassSchema = createInsertSchema(schoolClassesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClass = z.infer<typeof insertClassSchema>;
export type SchoolClass = typeof schoolClassesTable.$inferSelect;
export type ClassEnrollment = typeof classEnrollmentsTable.$inferSelect;
