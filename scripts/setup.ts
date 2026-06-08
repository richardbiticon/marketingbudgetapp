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
