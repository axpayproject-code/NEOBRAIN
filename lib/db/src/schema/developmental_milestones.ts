import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const developmentalMilestonesTable = pgTable("developmental_milestones", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  domain: text("domain").notNull(),
  milestone: text("milestone").notNull(),
  typicalAgeMonths: integer("typical_age_months"),
  status: text("status").notNull().default("pending"),
  achievedAt: timestamp("achieved_at", { withTimezone: true }),
  observedBy: text("observed_by"),
  notes: text("notes"),
  isDelayed: boolean("is_delayed").notNull().default(false),
  screeningId: integer("screening_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDevelopmentalMilestoneSchema = createInsertSchema(developmentalMilestonesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDevelopmentalMilestone = z.infer<typeof insertDevelopmentalMilestoneSchema>;
export type DevelopmentalMilestone = typeof developmentalMilestonesTable.$inferSelect;
