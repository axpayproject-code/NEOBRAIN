import { pgTable, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const specialtyFeesTable = pgTable("specialty_fees", {
  specialistType: text("specialist_type").primaryKey(),
  feeAmount: doublePrecision("fee_amount").notNull(),
  currency: text("currency").notNull().default("PHP"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSpecialtyFeeSchema = createInsertSchema(specialtyFeesTable);
export type InsertSpecialtyFee = z.infer<typeof insertSpecialtyFeeSchema>;
export type SpecialtyFee = typeof specialtyFeesTable.$inferSelect;
