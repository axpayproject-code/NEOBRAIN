import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiAnalysisResultsTable = pgTable("ai_analysis_results", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  screeningId: integer("screening_id"),
  analysisType: text("analysis_type").notNull(),
  modelUsed: text("model_used").notNull().default("gemini"),
  inputSummary: text("input_summary"),
  rawOutput: text("raw_output"),
  structuredInsights: jsonb("structured_insights"),
  confidenceScore: integer("confidence_score"),
  flaggedConcerns: text("flagged_concerns"),
  recommendations: text("recommendations"),
  processingTimeMs: integer("processing_time_ms"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiAnalysisResultSchema = createInsertSchema(aiAnalysisResultsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAiAnalysisResult = z.infer<typeof insertAiAnalysisResultSchema>;
export type AiAnalysisResult = typeof aiAnalysisResultsTable.$inferSelect;
