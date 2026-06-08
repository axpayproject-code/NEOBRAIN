import { pgTable, text, serial, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const queueEntriesTable = pgTable("queue_entries", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  childName: text("child_name").notNull(),
  userId: uuid("user_id"),
  clinicUserId: uuid("clinic_user_id"),
  queueDate: text("queue_date").notNull(),
  queueNumber: integer("queue_number").notNull(),
  appointmentId: integer("appointment_id"),
  status: text("status").notNull().default("waiting"),
  triageLevel: text("triage_level").notNull().default("routine"),
  waitStartedAt: timestamp("wait_started_at", { withTimezone: true }).notNull().defaultNow(),
  calledAt: timestamp("called_at", { withTimezone: true }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  estimatedWaitMinutes: integer("estimated_wait_minutes"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQueueEntrySchema = createInsertSchema(queueEntriesTable).omit({ id: true, createdAt: true });
export type InsertQueueEntry = z.infer<typeof insertQueueEntrySchema>;
export type QueueEntry = typeof queueEntriesTable.$inferSelect;
