import { integer, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { specialistThreads } from "./specialist_threads";
import { usersTable } from "./users";

export const specialistMessages = pgTable("specialist_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => specialistThreads.id, { onDelete: "cascade" }),
  senderUserId: uuid("sender_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  senderRole: text("sender_role").notNull(),
  content: text("content").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertSpecialistMessageSchema = createInsertSchema(specialistMessages).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export type SpecialistMessage = typeof specialistMessages.$inferSelect;
export type InsertSpecialistMessage = z.infer<typeof insertSpecialistMessageSchema>;
