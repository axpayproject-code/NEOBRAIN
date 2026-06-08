import { pgTable, text, serial, integer, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const brainGymActivitiesTable = pgTable("brain_gym_activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  minAgeMonths: integer("min_age_months").notNull().default(0),
  maxAgeMonths: integer("max_age_months").notNull().default(216),
  durationMinutes: integer("duration_minutes").notNull().default(5),
  difficulty: text("difficulty").notNull().default("easy"),
  domain: text("domain").notNull().default("general"),
  instructions: text("instructions"),
  iconEmoji: text("icon_emoji").default("🧠"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const brainGymSessionsTable = pgTable("brain_gym_sessions", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  userId: uuid("user_id").notNull(),
  activityId: integer("activity_id").notNull(),
  activityName: text("activity_name").notNull(),
  category: text("category").notNull(),
  domain: text("domain").notNull().default("general"),
  score: integer("score").notNull().default(0),
  maxScore: integer("max_score").notNull().default(100),
  durationSeconds: integer("duration_seconds"),
  completed: boolean("completed").notNull().default(false),
  badgeEarned: text("badge_earned"),
  notes: text("notes"),
  sessionDate: timestamp("session_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBrainGymSessionSchema = createInsertSchema(brainGymSessionsTable).omit({ id: true, createdAt: true });
export type InsertBrainGymSession = z.infer<typeof insertBrainGymSessionSchema>;
export type BrainGymSession = typeof brainGymSessionsTable.$inferSelect;
export type BrainGymActivity = typeof brainGymActivitiesTable.$inferSelect;
