import "dotenv/config";
import { sql } from "drizzle-orm";
import { getDb } from "../lib/db";

// Non-interactive schema apply. Creates enums and tables if missing.
// Mirrors lib/schema.ts. Safe to run repeatedly.
const db = getDb();

const enums: [string, string[]][] = [
  ["channel", ["meta", "google", "microsoft", "klaviyo", "attentive", "partnerships", "tools", "labor", "ugc", "other"]],
  ["category", ["team", "retail", "shared"]],
  ["expense_type", ["one_time", "recurring"]],
  ["status", ["planned", "committed", "spent"]],
];

const tables = [
  `CREATE TABLE IF NOT EXISTS "expenses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "channel" "channel" NOT NULL,
    "category" "category" NOT NULL,
    "amount_cents" integer NOT NULL,
    "period" text NOT NULL,
    "type" "expense_type" DEFAULT 'one_time' NOT NULL,
    "status" "status" DEFAULT 'planned' NOT NULL,
    "vendor" text,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "settings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "monthly_budget_cents" integer DEFAULT 0 NOT NULL,
    "test_innovation_pct" numeric DEFAULT '10' NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "targets" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "period" text NOT NULL,
    "category" "category" NOT NULL,
    "target_pct" numeric NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "entity_type" text NOT NULL,
    "entity_id" text NOT NULL,
    "author" text NOT NULL,
    "body" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "activity" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "entity_type" text NOT NULL,
    "entity_id" text NOT NULL,
    "actor" text NOT NULL,
    "action" text NOT NULL,
    "summary" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "planned_emails" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "send_date" text NOT NULL,
    "track" text DEFAULT 'teams' NOT NULL,
    "platform" text DEFAULT 'Redo' NOT NULL,
    "subject_a" text NOT NULL,
    "subject_b" text,
    "preheader" text,
    "body" text,
    "status" text DEFAULT 'draft' NOT NULL,
    "owner" text,
    "html" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "social_posts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "post_date" text NOT NULL,
    "pillar" text DEFAULT 'Education' NOT NULL,
    "concept" text NOT NULL,
    "caption" text,
    "format" text,
    "status" text DEFAULT 'planned' NOT NULL,
    "owner" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "attachments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "entity_type" text NOT NULL,
    "entity_id" text NOT NULL,
    "filename" text NOT NULL,
    "mime" text NOT NULL,
    "data" text NOT NULL,
    "size_bytes" integer DEFAULT 0 NOT NULL,
    "uploader" text DEFAULT 'Someone' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "inbound_emails" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "to_addr" text,
    "from_addr" text,
    "subject" text DEFAULT '' NOT NULL,
    "html" text NOT NULL,
    "matched_email_id" uuid,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "rebuild_positions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "mandate" text,
    "tasks_now" jsonb DEFAULT '[]' NOT NULL,
    "tasks_later" jsonb DEFAULT '[]' NOT NULL,
    "kpis" jsonb DEFAULT '[]' NOT NULL,
    "pay_min" integer,
    "pay_max" integer,
    "pay_ramp_note" text,
    "cadence" text,
    "budget_note" text,
    "job_post" text,
    "tracker_url" text,
    "activated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_by" text DEFAULT 'Someone' NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "rebuild_candidates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "position_id" uuid,
    "name" text NOT NULL,
    "email" text,
    "location" text,
    "expected_salary" integer,
    "portfolio_url" text,
    "olj_profile_url" text,
    "resume_url" text,
    "stage" text DEFAULT 'applied' NOT NULL,
    "scores" jsonb,
    "profile" jsonb,
    "source_pdf_url" text,
    "source" text DEFAULT 'manual' NOT NULL,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_by" text DEFAULT 'Someone' NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "rebuild_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "position_id" uuid,
    "candidate_id" uuid,
    "type" text NOT NULL,
    "payload" jsonb,
    "actor" text DEFAULT 'Someone' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "rebuild_imports" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "position_id" uuid NOT NULL,
    "filename" text NOT NULL,
    "row_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "actor" text DEFAULT 'Someone' NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "rebuild_guideline" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "content" text DEFAULT '' NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_by" text DEFAULT 'Someone' NOT NULL
  )`,
];

async function main() {
  for (const [name, values] of enums) {
    const labels = values.map((v) => `'${v}'`).join(", ");
    await db.execute(
      sql.raw(`DO $$ BEGIN CREATE TYPE "${name}" AS ENUM(${labels}); EXCEPTION WHEN duplicate_object THEN null; END $$;`)
    );
    console.log(`enum ${name} ok`);
  }
  for (const t of tables) {
    await db.execute(sql.raw(t));
  }
  console.log("tables ok. schema applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
