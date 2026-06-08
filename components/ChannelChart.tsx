"use client";
import { motion } from "framer-motion";
import { CATEGORY_COLOR, CATEGORY_LABEL, CHANNEL_LABEL, type Category } from "@/lib/constants";
import { byChannel } from "@/lib/rollups";
import type { ExpenseRow } from "@/lib/rollups";
import { dollars } from "@/lib/format";

// Hand-built horizontal bars: longest at top, value at the end, colored by
// dominant category. Recharts is used for the category mix below.
export function ChannelChart({ rows }: { rows: ExpenseRow[] }) {
  const data = byChannel(rows);
  const max = Math.max(1, ...data.map((d) => d.cents));

  if (!data.length) {
    return <div className="py-10 text-center text-sm text-dim">No spend recorded for this month.</div>;
  }

  return (
    <div>
      <div className="space-y-4">
        {data.map((d, i) => (
          <div key={d.channel}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-sm font-medium text-cream-light">{CHANNEL_LABEL[d.channel]}</span>
              <span className="font-mono text-xs text-dim">{CATEGORY_LABEL[d.category]}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-7 flex-1 overflow-hidden rounded bg-white/[0.05]">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded"
                  style={{ background: CATEGORY_COLOR[d.category] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.cents / max) * 100}%` }}
                  transition={{ duration: 0.9, delay: i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
                />
              </div>
              <span className="w-24 text-right font-mono text-sm tabular-nums text-cream-light">
                {dollars(d.cents)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Legend />
    </div>
  );
}

function Legend() {
  const cats: Category[] = ["team", "retail", "shared"];
  return (
    <div className="mt-6 flex flex-wrap gap-5">
      {cats.map((c) => (
        <span key={c} className="inline-flex items-center gap-2 text-xs text-dim">
          <span className="h-3 w-3 rounded-[2px]" style={{ background: CATEGORY_COLOR[c] }} />
          {CATEGORY_LABEL[c]}
        </span>
      ))}
    </div>
  );
}
