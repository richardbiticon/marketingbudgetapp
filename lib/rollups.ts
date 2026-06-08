import { CHANNELS, CATEGORIES, type Category, type Channel } from "./constants";

// The shape the client works with (JSON-serialized expense).
export interface ExpenseRow {
  id: string;
  name: string;
  channel: Channel;
  category: Category;
  amountCents: number;
  period: string;
  type: "one_time" | "recurring";
  status: "planned" | "committed" | "spent";
  vendor: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TargetRow {
  id: string;
  period: string;
  category: Category;
  targetPct: string;
}

export interface SettingsRow {
  id: string;
  monthlyBudgetCents: number;
  testInnovationPct: string;
}

// All rollups derive from rows at call time. Nothing is stored computed.
export function totalCents(rows: ExpenseRow[]): number {
  return rows.reduce((s, r) => s + r.amountCents, 0);
}

export function byCategory(rows: ExpenseRow[]): Record<Category, number> {
  const out = { team: 0, retail: 0, shared: 0 } as Record<Category, number>;
  for (const r of rows) out[r.category] += r.amountCents;
  return out;
}

export function byChannel(rows: ExpenseRow[]): { channel: Channel; cents: number; category: Category }[] {
  const map = new Map<Channel, { cents: number; cat: Record<Category, number> }>();
  for (const r of rows) {
    if (!map.has(r.channel)) map.set(r.channel, { cents: 0, cat: { team: 0, retail: 0, shared: 0 } });
    const e = map.get(r.channel)!;
    e.cents += r.amountCents;
    e.cat[r.category] += r.amountCents;
  }
  return CHANNELS.filter((c) => map.has(c))
    .map((c) => {
      const e = map.get(c)!;
      // dominant category for bar color
      const cat = (Object.keys(e.cat) as Category[]).sort((a, b) => e.cat[b] - e.cat[a])[0];
      return { channel: c, cents: e.cents, category: cat };
    })
    .sort((a, b) => b.cents - a.cents);
}

export function categoryPct(rows: ExpenseRow[]): Record<Category, number> {
  const total = totalCents(rows) || 1;
  const cat = byCategory(rows);
  return {
    team: (cat.team / total) * 100,
    retail: (cat.retail / total) * 100,
    shared: (cat.shared / total) * 100,
  };
}

export interface TargetVsActual {
  category: Category;
  targetPct: number;
  actualPct: number;
  actualCents: number;
  varianceCents: number; // actual minus target (in cents of total)
  over: boolean;
}

export function targetVsActual(
  rows: ExpenseRow[],
  targets: TargetRow[]
): TargetVsActual[] {
  const total = totalCents(rows);
  const cat = byCategory(rows);
  const pcts = categoryPct(rows);
  const tmap = new Map<Category, number>();
  for (const t of targets) tmap.set(t.category, Number(t.targetPct));
  return CATEGORIES.map((c) => {
    const targetPct = tmap.get(c) ?? 0;
    const targetCents = Math.round((targetPct / 100) * total);
    const actualCents = cat[c];
    return {
      category: c,
      targetPct,
      actualPct: pcts[c],
      actualCents,
      varianceCents: actualCents - targetCents,
      over: actualCents - targetCents > 0,
    };
  });
}

// Test and Innovation carve-out: a slice of total spend earmarked for testing.
// Tagged by notes containing "test" or channel "other" with status planned is too loose,
// so we treat any expense whose notes include "[test]" as carve-out spend.
export function carveout(rows: ExpenseRow[], settings: SettingsRow | null) {
  const total = totalCents(rows);
  const targetPct = settings ? Number(settings.testInnovationPct) : 10;
  const spentCents = rows
    .filter((r) => (r.notes ?? "").toLowerCase().includes("[test]"))
    .reduce((s, r) => s + r.amountCents, 0);
  const targetCents = Math.round((targetPct / 100) * total);
  const actualPct = total ? (spentCents / total) * 100 : 0;
  return {
    targetPct,
    actualPct,
    spentCents,
    targetCents,
    remainingCents: Math.max(0, targetCents - spentCents),
  };
}

export function toCSV(rows: ExpenseRow[]): string {
  const head = [
    "name", "channel", "category", "amount_usd", "period",
    "type", "status", "vendor", "notes",
  ];
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.name, r.channel, r.category, (r.amountCents / 100).toFixed(2), r.period,
      r.type, r.status, r.vendor ?? "", r.notes ?? "",
    ]
      .map((v) => esc(String(v)))
      .join(",")
  );
  return [head.join(","), ...lines].join("\n");
}
