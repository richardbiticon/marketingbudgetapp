"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CATEGORY_COLOR, CATEGORY_LABEL, type Category } from "@/lib/constants";

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("font-mono text-[11px] uppercase tracking-[0.18em] text-dim", className)}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 mt-12 flex items-center gap-3 first:mt-0">
      <Eyebrow>/ {children}</Eyebrow>
      <span className="h-px flex-1 bg-gradient-to-r from-line2 to-transparent" />
    </div>
  );
}

export function Panel({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn(
        "rounded-xl border border-line bg-ink-panel p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function CategoryDot({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: CATEGORY_COLOR[category] }} />
      {CATEGORY_LABEL[category]}
    </span>
  );
}

const STATUS_STYLE: Record<string, string> = {
  planned: "text-dim border-line bg-white/[0.04]",
  committed: "text-[#e3ad36] border-[#e3ad36]/30 bg-[#e3ad36]/10",
  spent: "text-[#57c47b] border-[#57c47b]/30 bg-[#57c47b]/10",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        STATUS_STYLE[status] ?? STATUS_STYLE.planned
      )}
    >
      {status}
    </span>
  );
}
