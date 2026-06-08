import { pgTable, text, serial, integer, timestamp, uuid, boolean, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const healthProgramsTable = pgTable("health_programs", {
  id: serial("id").primaryKey(),
  govUserId: uuid("gov_user_id").notNull(),
  programName: text("program_name").notNull(),
  programCode: text("program_code"),
  category: text("category").notNull(),
  description: text("description"),
  targetRegion: text("target_region"),
  targetProvince: text("target_province"),
  targetMunicipality: text("target_municipality"),
  targetBarangay: text("target_barangay"),
  targetPopulation: text("target_population"),
  targetCount: integer("target_count"),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  completedCount: integer("completed_count").notNull().default(0),
  budget: doublePrecision("budget"),
  expenditure: doublePrecision("expenditure").notNull().default(0),
  fundingSource: text("funding_source"),
  implementingAgency: text("implementing_agency"),
  partnerAgencies: jsonb("partner_agencies"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  status: text("status").notNull().default("active"),
  progressPercentage: doublePrecision("progress_percentage").notNull().default(0),
  keyIndicators: jsonb("key_indicators"),
  reports: jsonb("reports"),
  isNational: boolean("is_national").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHealthProgramSchema = createInsertSchema(healthProgramsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHealthProgram = z.infer<typeof insertHealthProgramSchema>;
export type HealthProgram = typeof healthProgramsTable.$inferSelect;
