import { pgTable, text, serial, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const childrenTable = pgTable("children", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull().default("other"),
  avatarUrl: text("avatar_url"),
  parentName: text("parent_name"),
  parentEmail: text("parent_email"),
  parentPhone: text("parent_phone"),
  schoolName: text("school_name"),
  riskLevel: text("risk_level").notNull().default("low"),
  diagnosisNotes: text("diagnosis_notes"),
  therapistId: integer("therapist_id"),
  userId: uuid("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertChildSchema = createInsertSchema(childrenTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof childrenTable.$inferSelect;
