import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const riskHistoryTable = pgTable("risk_history", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  previousRiskLevel: text("previous_risk_level"),
  newRiskLevel: text("new_risk_level").notNull(),
  triggerType: text("trigger_type").notNull(),
  triggerResourceId: integer("trigger_resource_id"),
  communicationScore: integer("communication_score"),
  socialScore: integer("social_score"),
  attentionScore: integer("attention_score"),
  motorScore: integer("motor_score"),
  emotionalScore: integer("emotional_score"),
  changedBy: text("changed_by"),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRiskHistorySchema = createInsertSchema(riskHistoryTable).omit({
  id: true,
  recordedAt: true,
});
export type InsertRiskHistory = z.infer<typeof insertRiskHistorySchema>;
export type RiskHistory = typeof riskHistoryTable.$inferSelect;
