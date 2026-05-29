import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const screeningResponsesTable = pgTable("screening_responses", {
  id: serial("id").primaryKey(),
  screeningId: integer("screening_id").notNull(),
  childId: integer("child_id").notNull(),
  questionCode: text("question_code").notNull(),
  domain: text("domain").notNull(),
  questionText: text("question_text").notNull(),
  responseValue: text("response_value").notNull(),
  responseLabel: text("response_label"),
  scoreContribution: integer("score_contribution"),
  flagged: text("flagged"),
  respondentType: text("respondent_type").notNull().default("parent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScreeningResponseSchema = createInsertSchema(screeningResponsesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertScreeningResponse = z.infer<typeof insertScreeningResponseSchema>;
export type ScreeningResponse = typeof screeningResponsesTable.$inferSelect;
