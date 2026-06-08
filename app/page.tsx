import { and, eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { expenses, targets, settings } from "@/lib/schema";
import { currentPeriod } from "@/lib/format";
import { BudgetApp } from "@/components/BudgetApp";
import { SetupNotice } from "@/components/SetupNotice";
import type { ExpenseRow, TargetRow, SettingsRow } from "@/lib/rollups";

export const dynamic = "force-dynamic";

export default async function Page() {
  const period = currentPeriod();

  try {
    const db = getDb();
    const [eRows, tRows, sRows] = await Promise.all([
      db.select().from(expenses).where(eq(expenses.period, period)).orderBy(desc(expenses.amountCents)),
      db.select().from(targets).where(eq(targets.period, period)),
      db.select().from(settings).limit(1),
    ]);

    const expensesData: ExpenseRow[] = eRows.map((r) => ({
      id: r.id, name: r.name, channel: r.channel, category: r.category,
      amountCents: r.amountCents, period: r.period, type: r.type, status: r.status,
      vendor: r.vendor, notes: r.notes,
      createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
    }));
    const targetsData: TargetRow[] = tRows.map((t) => ({
      id: t.id, period: t.period, category: t.category, targetPct: String(t.targetPct),
    }));
    const settingsData: SettingsRow | null = sRows[0]
      ? { id: sRows[0].id, monthlyBudgetCents: sRows[0].monthlyBudgetCents, testInnovationPct: String(sRows[0].testInnovationPct) }
      : null;

    return (
      <main>
        <BudgetApp initial={{ period, expenses: expensesData, targets: targetsData, settings: settingsData }} />
      </main>
    );
  } catch (e: any) {
    return <SetupNotice detail={e?.message} />;
  }
}
