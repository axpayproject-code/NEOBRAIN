import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";

export const ticketsTable = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().default("referral"),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("normal"),
  fromUserId: uuid("from_user_id").notNull(),
  fromUserName: text("from_user_name").notNull(),
  fromRole: text("from_role").notNull(),
  toUserId: uuid("to_user_id"),
  toUserName: text("to_user_name"),
  toRole: text("to_role"),
  patientName: text("patient_name"),
  patientId: uuid("patient_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export type Ticket = typeof ticketsTable.$inferSelect;
