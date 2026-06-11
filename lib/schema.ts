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

// ---- Campaigns: email + social planning ----
export const plannedEmails = pgTable("planned_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  sendDate: text("send_date").notNull(), // "YYYY-MM-DD"
  track: text("track").notNull().default("teams"), // teams | retail | customfuze | other
  platform: text("platform").notNull().default("Redo"),
  subjectA: text("subject_a").notNull(),
  subjectB: text("subject_b"),
  preheader: text("preheader"),
  body: text("body"), // working copy / notes
  status: text("status").notNull().default("draft"), // idea|draft|built|review|scheduled|sent
  owner: text("owner"),
  html: text("html"), // captured test-send / pasted HTML for the preview
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const socialPosts = pgTable("social_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  postDate: text("post_date").notNull(), // "YYYY-MM-DD"
  pillar: text("pillar").notNull().default("Education"),
  concept: text("concept").notNull(),
  caption: text("caption"),
  format: text("format"),
  status: text("status").notNull().default("planned"), // planned|drafted|approved|posted
  owner: text("owner"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Generic file attachments (images) for any entity. Stored as base64 in
// Postgres for zero-config; swap the storage fn for Vercel Blob later.
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  data: text("data").notNull(), // base64
  sizeBytes: integer("size_bytes").notNull().default(0),
  uploader: text("uploader").notNull().default("Someone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Inbound test emails (from the inbound-parse webhook). Matched to a
// planned email by subject or [pe:xxxxxxxx] token; unmatched ones can be
// linked manually from the UI.
export const inboundEmails = pgTable("inbound_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  toAddr: text("to_addr"),
  fromAddr: text("from_addr"),
  subject: text("subject").notNull().default(""),
  html: text("html").notNull(),
  matchedEmailId: uuid("matched_email_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Target = typeof targets.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Activity = typeof activity.$inferSelect;
export type PlannedEmail = typeof plannedEmails.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type InboundEmail = typeof inboundEmails.$inferSelect;
