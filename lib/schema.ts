import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const channelEnum = pgEnum("channel", [
  "meta",
  "google",
  "microsoft",
  "klaviyo",
  "attentive",
  "partnerships",
  "tools",
  "labor",
  "ugc",
  "other",
]);

export const categoryEnum = pgEnum("category", ["team", "retail", "shared"]);
export const typeEnum = pgEnum("expense_type", ["one_time", "recurring"]);
export const statusEnum = pgEnum("status", ["planned", "committed", "spent"]);

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  channel: channelEnum("channel").notNull(),
  category: categoryEnum("category").notNull(),
  amountCents: integer("amount_cents").notNull(),
  period: text("period").notNull(), // "YYYY-MM"
  type: typeEnum("type").notNull().default("one_time"),
  status: statusEnum("status").notNull().default("planned"),
  vendor: text("vendor"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const targets = pgTable("targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  period: text("period").notNull(),
  category: categoryEnum("category").notNull(),
  targetPct: numeric("target_pct").notNull(),
});

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  monthlyBudgetCents: integer("monthly_budget_cents").notNull().default(0),
  testInnovationPct: numeric("test_innovation_pct").notNull().default("10"),
});

// ---- Collaboration substrate (reused by every module via entity_type/id) ----
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(), // e.g. "budget-month", "expense", "email"
  entityId: text("entity_id").notNull(),
  author: text("author").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activity = pgTable("activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  actor: text("actor").notNull(),
  action: text("action").notNull(), // created | updated | deleted | commented
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Target = typeof targets.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Activity = typeof activity.$inferSelect;
