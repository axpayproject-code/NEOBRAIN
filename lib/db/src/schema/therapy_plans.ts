import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const therapyPlansTable = pgTable("therapy_plans", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  title: text("title").notNull(),
  therapyType: text("therapy_type").notNull(),
  status: text("status").notNull().default("active"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  goals: text("goals"),
  weeklyTasks: text("weekly_tasks"),
  homeExercises: text("home_exercises"),
  progressPercentage: integer("progress_percentage").default(0),
  therapistName: text("therapist_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTherapyPlanSchema = createInsertSchema(therapyPlansTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTherapyPlan = z.infer<typeof insertTherapyPlanSchema>;
export type TherapyPlan = typeof therapyPlansTable.$inferSelect;
