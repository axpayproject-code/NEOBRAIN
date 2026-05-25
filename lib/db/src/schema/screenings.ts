import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const screeningsTable = pgTable("screenings", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  screeningType: text("screening_type").notNull(),
  status: text("status").notNull().default("pending"),
  riskLevel: text("risk_level"),
  communicationScore: integer("communication_score"),
  socialScore: integer("social_score"),
  attentionScore: integer("attention_score"),
  motorScore: integer("motor_score"),
  emotionalScore: integer("emotional_score"),
  behavioralClusters: text("behavioral_clusters"),
  referralRecommendations: text("referral_recommendations"),
  clinicalSummary: text("clinical_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertScreeningSchema = createInsertSchema(screeningsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertScreening = z.infer<typeof insertScreeningSchema>;
export type Screening = typeof screeningsTable.$inferSelect;
