"use client";
import * as React from "react";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MonthSwitcher } from "./MonthSwitcher";
import { OverviewCards } from "./OverviewCards";
import { ChannelChart } from "./ChannelChart";
import { TargetVsActual } from "./TargetVsActual";
import { ExpensesTable } from "./ExpensesTable";
import { SectionLabel, Eyebrow } from "./bits";
import { Input } from "./ui/input";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/constants";
import type { ExpenseRow, TargetRow, SettingsRow } from "@/lib/rollups";
import type { ExpenseInput } from "@/lib/validation";

interface InitialData {
  period: string;
  expenses: ExpenseRow[];
  targets: TargetRow[];
  settings: SettingsRow | null;
}

export function BudgetApp({ initial }: { initial: InitialData }) {
  const [period, setPeriod] = React.useState(initial.period);
  const [rows, setRows] = React.useState<ExpenseRow[]>(initial.expenses);
  const [targets, setTargets] = React.useState<TargetRow[]>(initial.targets);
  const [settings, setSettings] = React.useState<SettingsRow | null>(initial.settings);
  const firstRender = React.useRef(true);

  const loadAll = React.useCallback(async (p: string) => {
    const [eRes, tRes, sRes] = await Promise.all([
      fetch(`/api/expenses?period=${p}`, { cache: "no-store" }),
      fetch(`/api/targets?period=${p}`, { cache: "no-store" }),
      fetch(`/api/settings`, { cache: "no-store" }),
    ]);
    if (eRes.ok) setRows((await eRes.json()).expenses);
    if (tRes.ok) setTargets((await tRes.json()).targets);
    if (sRes.ok) setSettings((await sRes.json()).settings);
  }, []);

  // Refetch when the period changes (skip the very first render: server gave us data).
  React.useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    loadAll(period);
  }, [period, loadAll]);

  // Refetch on window focus so a tab left open catches new rows from teammates.
  React.useEffect(() => {
    const onFocus = () => loadAll(period);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [period, loadAll]);

  async function onAdd(input: ExpenseInput) {
    const temp: ExpenseRow = {
      id: "temp-" + Math.random().toString(36).slice(2),
      name: input.name, channel: input.channel, category: input.category,
      amountCents: Math.round(input.amount * 100), period: input.period,
      type: input.type, status: input.status, vendor: input.vendor ?? null,
      notes: input.notes ?? null, createdAt: "", updatedAt: "",
    };
    setRows((r) => [temp, ...r]); // optimistic
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      setRows((r) => r.filter((x) => x.id !== temp.id));
      throw new Error("Could not save expense");
    }
    const { expense } = await res.json();
    setRows((r) => r.map((x) => (x.id === temp.id ? expense : x)));
  }

  async function onUpdate(id: string, patch: Partial<ExpenseInput>) {
    const before = rows;
    setRows((r) =>
      r.map((x) =>
        x.id === id
          ? { ...x, ...patch, amountCents: patch.amount != null ? Math.round(patch.amount * 100) : x.amountCents } as ExpenseRow
          : x
      )
    );
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { setRows(before); return; }
    const { expense } = await res.json();
    setRows((r) => r.map((x) => (x.id === id ? expense : x)));
  }

  async function onDelete(id: string) {
    const before = rows;
    setRows((r) => r.filter((x) => x.id !== id));
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) setRows(before);
  }

  async function onSetTarget(category: Category, value: number) {
    setTargets((t) => {
      const found = t.find((x) => x.category === category);
      if (found) return t.map((x) => (x.category === category ? { ...x, targetPct: String(value) } : x));
      return [...t, { id: "temp", period, category, targetPct: String(value) }];
    });
    await fetch("/api/targets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, category, targetPct: value }),
    });
  }

  return (
    <div className="mx-auto max-w-[1240px] px-6 pb-24 pt-7 md:px-10">
      {/* header */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <a
            href="/"
            title="Back to Marketing OS"
            className="flex items-center gap-2 rounded-full border border-line2 bg-white/[0.03] px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-cream-base transition-colors hover:bg-white/[0.08]"
          >
            <ChevronLeft className="h-4 w-4" /> OS
          </a>
          <Image src="/logo.png" alt="All Volleyball" width={44} height={44} className="rounded-lg" priority />
          <div>
            <Eyebrow>/ BUDGET</Eyebrow>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-cream-light">Marketing budget</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-dim sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#57c47b]" /> Live. Postgres
          </span>
          <MonthSwitcher period={period} onChange={setPeriod} />
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <SectionLabel>OVERVIEW</SectionLabel>
          <OverviewCards rows={rows} settings={settings} />

          <SectionLabel>SPEND BY CHANNEL</SectionLabel>
          <div className="rounded-xl border border-line bg-ink-panel p-6">
            <ChannelChart rows={rows} />
          </div>

          <SectionLabel>TARGET MIX VS ACTUAL</SectionLabel>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-xl border border-line bg-ink-panel p-6 lg:col-span-2">
              <TargetVsActual rows={rows} targets={targets} />
            </div>
            <div className="rounded-xl border border-line bg-ink-panel p-6">
              <Eyebrow>/ SET TARGETS</Eyebrow>
              <p className="mb-4 mt-2 text-xs text-dim">Target percent of monthly spend per category.</p>
              <div className="space-y-3">
                {CATEGORIES.map((c) => {
                  const cur = targets.find((t) => t.category === c);
                  return (
                    <div key={c} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-cream-base">{CATEGORY_LABEL[c]}</span>
                      <div className="flex items-center gap-1.5">
                        <Input
                          className="h-8 w-20 text-right tabular-nums"
                          inputMode="numeric"
                          defaultValue={cur ? Number(cur.targetPct).toString() : "0"}
                          onBlur={(e) => onSetTarget(c, Number(e.target.value) || 0)}
                        />
                        <span className="text-sm text-dim">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <SectionLabel>EXPENSES</SectionLabel>
          <ExpensesTable rows={rows} period={period} onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
