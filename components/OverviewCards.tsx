"use client";
import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CountUp } from "./CountUp";
import { Eyebrow } from "./bits";
import { cn } from "@/lib/utils";
import { dollars, pct } from "@/lib/format";
import { CATEGORY_COLOR, CATEGORY_LABEL, type Category } from "@/lib/constants";
import {
  totalCents,
  byCategory,
  categoryPct,
  carveout,
  type ExpenseRow,
  type SettingsRow,
} from "@/lib/rollups";

function MetricCard({
  label,
  valueCents,
  sub,
  accent = false,
  delay = 0,
}: {
  label: string;
  valueCents: number;
  sub?: string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-line bg-ink-panel p-6",
        "before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
        accent ? "before:bg-red" : "before:bg-white/10"
      )}
      style={{ animation: `fade-in .5s ${delay}s both cubic-bezier(.2,.7,.2,1)` }}
    >
      <Eyebrow>/ {label}</Eyebrow>
      <div className="mt-3 text-[2.6rem] font-bold leading-none tracking-tight tabular-nums text-cream-light">
        <CountUp value={valueCents} format={(n) => dollars(n)} />
      </div>
      {sub ? <div className="mt-2 text-xs text-dim">{sub}</div> : null}
    </div>
  );
}

export function OverviewCards({
  rows,
  settings,
}: {
  rows: ExpenseRow[];
  settings: SettingsRow | null;
}) {
  const total = totalCents(rows);
  const cat = byCategory(rows);
  const pcts = categoryPct(rows);
  const co = carveout(rows, settings);
  const cats: Category[] = ["team", "retail", "shared"];

  const pie = cats.map((c) => ({ name: CATEGORY_LABEL[c], value: cat[c], cat: c }));
  const hasData = total > 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="MONTHLY TOTAL" valueCents={total} sub="across all channels" accent delay={0} />
        <MetricCard label="TEAM" valueCents={cat.team} sub={`${pct(pcts.team)} of spend`} delay={0.05} />
        <MetricCard label="RETAIL" valueCents={cat.retail} sub={`${pct(pcts.retail)} of spend`} delay={0.1} />
        <MetricCard label="SHARED" valueCents={cat.shared} sub={`${pct(pcts.shared)} of spend`} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Carve-out tracker */}
        <div className="rounded-xl border border-line2 bg-ink-raised p-6 shadow-[0_0_26px_rgba(215,23,42,.25)] lg:col-span-2">
          <Eyebrow>/ TEST AND INNOVATION CARVE-OUT</Eyebrow>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-4xl font-bold tabular-nums text-cream-light">{pct(co.actualPct, 1)}</span>
            <span className="text-sm text-dim">
              current. target {pct(co.targetPct)}.{" "}
              <span className="tabular-nums">{dollars(co.remainingCents)}</span> remaining
            </span>
          </div>
          <div className="relative mt-4 h-2.5 overflow-hidden rounded bg-white/10">
            <div
              className="absolute inset-y-0 left-0 rounded bg-red shadow-[0_0_14px_rgba(215,23,42,.6)]"
              style={{ width: `${Math.min(100, co.targetPct ? (co.actualPct / co.targetPct) * 100 : 0)}%` }}
            />
          </div>
          <p className="mt-4 max-w-[64ch] text-sm text-dim">
            Tag any expense note with [test] to count it toward the carve-out. The bar fills toward the target
            slice of monthly spend.
          </p>
        </div>

        {/* Recharts category mix */}
        <div className="rounded-xl border border-line bg-ink-panel p-6">
          <Eyebrow>/ CATEGORY MIX</Eyebrow>
          <div className="relative mt-2 h-[180px]">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" innerRadius={56} outerRadius={80} stroke="none" startAngle={90} endAngle={-270}>
                    {pie.map((p) => (
                      <Cell key={p.cat} fill={CATEGORY_COLOR[p.cat]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-dim">No data</div>
            )}
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-lg font-bold tabular-nums text-cream-light">{dollars(total, { compact: true })}</div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-dim">total</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
