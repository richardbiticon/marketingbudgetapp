"use client";
import { motion } from "framer-motion";
import { CATEGORY_LABEL } from "@/lib/constants";
import { targetVsActual, type ExpenseRow, type TargetRow } from "@/lib/rollups";
import { dollars, pct } from "@/lib/format";

export function TargetVsActual({
  rows,
  targets,
}: {
  rows: ExpenseRow[];
  targets: TargetRow[];
}) {
  const data = targetVsActual(rows, targets);
  return (
    <div className="space-y-7">
      {data.map((d) => (
        <div key={d.category}>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-cream-light">{CATEGORY_LABEL[d.category]}</span>
            <span className="font-mono text-xs text-dim">
              actual {pct(d.actualPct)} / target {pct(d.targetPct)}
            </span>
          </div>
          <div className="relative h-5 rounded bg-white/[0.06]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-[#2b2f37] to-[#4a515e]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, d.actualPct)}%` }}
              transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
            />
            <div
              className="absolute -top-1 -bottom-1 w-0.5 bg-red shadow-[0_0_10px_rgba(215,23,42,.7)]"
              style={{ left: `${Math.min(100, d.targetPct)}%` }}
            />
          </div>
          <div className="mt-2 text-xs">
            <span className={d.over ? "text-red" : "text-cream-base/70"}>
              {d.over ? "Over by " : "Under by "}
              <span className="tabular-nums">{dollars(Math.abs(d.varianceCents))}</span>
            </span>
            <span className="text-dim"> vs target allocation</span>
          </div>
        </div>
      ))}
    </div>
  );
}
