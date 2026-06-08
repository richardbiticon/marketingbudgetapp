"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { periodLabel, shiftPeriod } from "@/lib/format";

export function MonthSwitcher({
  period,
  onChange,
}: {
  period: string;
  onChange: (p: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-line bg-ink-panel p-1">
      <button
        onClick={() => onChange(shiftPeriod(period, -1))}
        className="grid h-8 w-8 place-items-center rounded-md text-dim hover:bg-white/5 hover:text-white transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="min-w-[150px] text-center text-sm font-medium tabular-nums text-cream-light">
        {periodLabel(period)}
      </div>
      <button
        onClick={() => onChange(shiftPeriod(period, 1))}
        className="grid h-8 w-8 place-items-center rounded-md text-dim hover:bg-white/5 hover:text-white transition-colors"
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
