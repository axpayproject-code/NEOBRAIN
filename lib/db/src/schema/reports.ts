import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  reportType: text("report_type").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  findings: text("findings"),
  recommendations: text("recommendations"),
  urgencyLevel: text("urgency_level").notNull().default("routine"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
