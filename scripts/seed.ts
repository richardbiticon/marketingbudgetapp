import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { expenses, targets, settings } from "../lib/schema";
import { currentPeriod } from "../lib/format";

// Seeds the current month with placeholder rows that reconcile to the
// known channel and category totals. Replace with real pulls later.
async function main() {
  const db = getDb();
  const period = currentPeriod();

  console.log(`Seeding period ${period}.`);

  // Idempotent: clear this period first.
  await db.delete(expenses).where(eq(expenses.period, period));
  await db.delete(targets).where(eq(targets.period, period));
  await db.delete(settings);

  const d = (usd: number) => Math.round(usd * 100);
  const note = "placeholder";

  const rows = [
    { name: "Meta prospecting", channel: "meta", category: "retail", amountCents: d(14200), vendor: "Meta", status: "spent", type: "recurring", notes: note },
    { name: "Meta retargeting, team", channel: "meta", category: "team", amountCents: d(6100), vendor: "Meta", status: "spent", type: "recurring", notes: note },
    { name: "Google Search, retail", channel: "google", category: "retail", amountCents: d(9800), vendor: "Google", status: "spent", type: "recurring", notes: note },
    { name: "Google Search, team", channel: "google", category: "team", amountCents: d(3400), vendor: "Google", status: "spent", type: "recurring", notes: note },
    { name: "Marketing labor allocation", channel: "labor", category: "shared", amountCents: d(8800), vendor: "Internal", status: "committed", type: "recurring", notes: note },
    { name: "Club partnerships", channel: "partnerships", category: "team", amountCents: d(5200), vendor: null, status: "committed", type: "recurring", notes: note },
    { name: "Software and tools", channel: "tools", category: "shared", amountCents: d(2300), vendor: null, status: "committed", type: "recurring", notes: "[test] placeholder. innovation tooling." },
    { name: "Klaviyo email platform", channel: "klaviyo", category: "shared", amountCents: d(1150), vendor: "Klaviyo", status: "committed", type: "recurring", notes: note },
    { name: "Attentive SMS", channel: "attentive", category: "retail", amountCents: d(980), vendor: "Attentive", status: "committed", type: "recurring", notes: note },
  ] as const;

  await db.insert(expenses).values(rows as any);

  await db.insert(targets).values([
    { period, category: "team", targetPct: "35" },
    { period, category: "retail", targetPct: "45" },
    { period, category: "shared", targetPct: "20" },
  ]);

  await db.insert(settings).values({ monthlyBudgetCents: d(51930), testInnovationPct: "10" });

  const total = rows.reduce((s, r) => s + r.amountCents, 0);
  console.log(`Inserted ${rows.length} expenses. Month total ${(total / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}.`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
