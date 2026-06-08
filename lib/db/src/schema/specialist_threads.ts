import { integer, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { childrenTable } from "./children";
import { usersTable } from "./users";

export const specialistThreads = pgTable("specialist_threads", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => childrenTable.id, { onDelete: "cascade" }),
  parentUserId: uuid("parent_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  specialistUserId: uuid("specialist_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  specialistType: text("specialist_type").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("active"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertSpecialistThreadSchema = createInsertSchema(specialistThreads).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export type SpecialistThread = typeof specialistThreads.$inferSelect;
export type InsertSpecialistThread = z.infer<typeof insertSpecialistThreadSchema>;
