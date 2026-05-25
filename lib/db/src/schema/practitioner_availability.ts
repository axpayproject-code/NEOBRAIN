import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const practitionerAvailabilityTable = pgTable("practitioner_availability", {
  id: serial("id").primaryKey(),
  practitionerName: text("practitioner_name").notNull(),
  specialistType: text("specialist_type"),
  dayOfWeek: integer("day_of_week"),
  specificDate: text("specific_date"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  slotDurationMinutes: integer("slot_duration_minutes").default(60),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPractitionerAvailabilitySchema = createInsertSchema(practitionerAvailabilityTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPractitionerAvailability = z.infer<typeof insertPractitionerAvailabilitySchema>;
export type PractitionerAvailability = typeof practitionerAvailabilityTable.$inferSelect;
