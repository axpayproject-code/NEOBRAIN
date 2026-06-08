import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";

export const featureFlagsTable = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  description: text("description"),
  enabledForRoles: text("enabled_for_roles").notNull().default("all"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FeatureFlag = typeof featureFlagsTable.$inferSelect;
