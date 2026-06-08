import { pgTable, text, serial, integer, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const interventionsTable = pgTable("interventions", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  schoolUserId: uuid("school_user_id").notNull(),
  observationId: integer("observation_id"),
  iepPlanId: integer("iep_plan_id"),
  title: text("title").notNull(),
  interventionType: text("intervention_type").notNull(),
  targetDomain: text("target_domain").notNull(),
  description: text("description"),
  strategy: text("strategy"),
  materials: text("materials"),
  implementedBy: text("implemented_by"),
  frequency: text("frequency"),
  duration: text("duration"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  targetBehavior: text("target_behavior"),
  successCriteria: text("success_criteria"),
  baselineData: text("baseline_data"),
  progressData: jsonb("progress_data"),
  outcome: text("outcome"),
  effectiveness: text("effectiveness"),
  parentInformed: boolean("parent_informed").notNull().default(false),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInterventionSchema = createInsertSchema(interventionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIntervention = z.infer<typeof insertInterventionSchema>;
export type Intervention = typeof interventionsTable.$inferSelect;
