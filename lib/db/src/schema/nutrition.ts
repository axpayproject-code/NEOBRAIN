import { pgTable, serial, integer, text, real, timestamp, uuid } from "drizzle-orm/pg-core";

export const nutritionProfilesTable = pgTable("nutrition_profiles", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  feedingType: text("feeding_type"),
  dietaryPattern: text("dietary_pattern"),
  nutritionStatus: text("nutrition_status").notNull().default("normal"),
  foodDiversityScore: real("food_diversity_score").default(0),
  mealConsistencyScore: real("meal_consistency_score").default(0),
  hydrationTracking: text("hydration_tracking"),
  notes: text("notes"),
  updatedBy: uuid("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const growthRecordsTable = pgTable("growth_records", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  measurementDate: text("measurement_date").notNull(),
  weight: real("weight"),
  height: real("height"),
  headCircumference: real("head_circumference"),
  bmi: real("bmi"),
  source: text("source").notNull().default("parent"),
  recordedBy: uuid("recorded_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedingHistoryTable = pgTable("feeding_history", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  feedingType: text("feeding_type").notNull(),
  frequency: text("frequency"),
  duration: text("duration"),
  amount: real("amount"),
  notes: text("notes"),
  recordedBy: uuid("recorded_by"),
  feedingTimestamp: timestamp("feeding_timestamp", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mealLogsTable = pgTable("meal_logs", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  date: text("date").notNull(),
  mealType: text("meal_type").notNull(),
  foodsConsumed: text("foods_consumed"),
  portion: text("portion"),
  notes: text("notes"),
  recordedBy: uuid("recorded_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const foodExposuresTable = pgTable("food_exposures", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  foodItem: text("food_item").notNull(),
  foodCategory: text("food_category"),
  firstIntroduced: text("first_introduced").notNull(),
  reactions: text("reactions"),
  accepted: text("accepted").default("yes"),
  notes: text("notes"),
  recordedBy: uuid("recorded_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const nutritionInsightsTable = pgTable("nutrition_insights", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  insightType: text("insight_type").notNull().default("general"),
  generatedInsight: text("generated_insight").notNull(),
  generatedDate: text("generated_date").notNull(),
  confidenceLevel: text("confidence_level").default("medium"),
  isRead: integer("is_read").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
