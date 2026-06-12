"use client";
import * as React from "react";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { Identity } from "./Identity";
import { ThemeToggle } from "./ThemeToggle";
import { Eyebrow } from "./bits";
import { STAGE_LABEL, STAGE_COLOR, STATUS_COLOR } from "@/lib/rebuild";
import { cn } from "@/lib/utils";

// ---- client types (JSON-serialized rows) ----
export interface PositionRow {
  id: string; slug: string; title: string; status: string;
  mandate: string | null;
  tasksNow: string[]; tasksLater: string[];
  kpis: { label: string; target: string }[];
  payMin: number | null; payMax: number | null; payRampNote: string | null;
  cadence: string | null; budgetNote: string | null;
  jobPost: string | null; trackerUrl: string | null;
  activatedAt: string | null; createdAt: string; updatedAt: string; updatedBy: string;
  applicantCount?: number;
}
export interface CandidateRow {
  id: string; positionId: string | null; name: string; email: string | null;
  location: string | null; expectedSalary: number | null;
  portfolioUrl: string | null; oljProfileUrl: string | null; resumeUrl: string | null;
  stage: string;
  scores: { skill?: number; ai_fluency?: number; hunger?: number; comms?: number } | null;
  profile: any; sourcePdfUrl: string | null; source: string; notes: string | null;
  createdAt: string; updatedAt: string; updatedBy: string;
}
export interface RebuildEventRow {
  id: string; positionId: string | null; candidateId: string | null;
  type: string; payload: any; actor: string; createdAt: string;
}

// ---- polling: every page revalidates on a 5s interval and on focus ----
export function usePoll(fn: () => void, deps: React.DependencyList) {
  const ref = React.useRef(fn);
  ref.current = fn;
  React.useEffect(() => {
    ref.current();
    const id = setInterval(() => ref.current(), 5000);
    const onFocus = () => ref.current();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(id); window.removeEventListener("focus", onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

// ---- shell: header shared by every rebuild page ----
export function RebuildShell({
  eyebrow, title, backHref = "/rebuild", backLabel = "Rebuild",
  updated, actions, children,
}: {
  eyebrow: string; title: string; backHref?: string; backLabel?: string;
  updated?: { at: string; by: string } | null;
  actions?: React.ReactNode; children: React.ReactNode;
}) {
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => { const id = setInterval(force, 5000); return () => clearInterval(id); }, []);
  return (
    <div className="mx-auto max-w-[1240px] px-6 pb-24 pt-7 md:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <a href={backHref} title={`Back to ${backLabel}`}
            className="flex items-center gap-2 rounded-full border border-line2 bg-white/[0.03] px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-cream-base transition-colors hover:bg-white/[0.08]">
            <ChevronLeft className="h-4 w-4" /> {backLabel}
          </a>
          <Image src="/logo.png" alt="All Volleyball" width={44} height={44} className="rounded-lg" priority />
          <div>
            <Eyebrow>/ {eyebrow}</Eyebrow>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-cream-light">{title}</h1>
            {updated ? (
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-dim">
                Updated {timeAgo(updated.at)} by {updated.by}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-dim md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#57c47b]" /> Live
          </span>
          <Identity />
          <ThemeToggle />
          {actions}
        </div>
      </header>
      {children}
    </div>
  );
}

// ---- pills ----
export function StatusPill({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? "#6b7280";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
      style={{ color: c, borderColor: c + "55", background: c + "1a" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{status}
    </span>
  );
}
export function StagePill({ stage }: { stage: string }) {
  const c = STAGE_COLOR[stage] ?? "#6b7280";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
      style={{ color: c, borderColor: c + "55", background: c + "1a" }}>
      {STAGE_LABEL[stage] ?? stage}
    </span>
  );
}

// ---- character-select stat bars ----
export function StatBars({ scores, compact = false }: { scores: CandidateRow["scores"]; compact?: boolean }) {
  const rows: [string, number | undefined][] = [
    ["Skill", scores?.skill], ["AI Fluency", scores?.ai_fluency], ["Hunger", scores?.hunger],
  ];
  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      {rows.map(([label, v]) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-20 shrink-0 font-mono text-[9px] uppercase tracking-wider text-dim">{label}</span>
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i}
                className={cn("h-1.5 flex-1 rounded-sm", compact && "h-1")}
                style={{ background: v && i <= v ? "#D7172A" : "rgba(128,128,128,.22)" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function InitialsAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
  return (
    <span className="grid place-items-center rounded-xl bg-red font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </span>
  );
}

// ---- the position card (builder live preview + entity Overview) ----
export function PositionCard({ p }: { p: PositionRow }) {
  const pay = p.payMin || p.payMax
    ? `$${(p.payMin ?? 0).toLocaleString()} to $${(p.payMax ?? 0).toLocaleString()} per month`
    : "Pay range not set";
  return (
    <div className="rounded-xl border border-line bg-ink-panel p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>/ POSITION</Eyebrow>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-cream-light">{p.title || "Untitled position"}</h2>
        </div>
        <StatusPill status={p.status} />
      </div>
      <p className="mt-3 text-sm text-cream-base/90">{p.mandate || "Mandate not written yet."}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-white/[0.02] p-3">
          <Eyebrow>/ PAY</Eyebrow>
          <p className="mt-1 text-sm font-semibold tabular-nums text-cream-light">{pay}</p>
          {p.payRampNote ? <p className="text-xs text-dim">{p.payRampNote}</p> : null}
        </div>
        <div className="rounded-lg border border-line bg-white/[0.02] p-3">
          <Eyebrow>/ CADENCE</Eyebrow>
          <p className="mt-1 text-sm text-cream-base/90">{p.cadence || "Not set."}</p>
        </div>
      </div>
      {p.tasksNow.length ? (
        <div className="mt-4">
          <Eyebrow>/ TASKS NOW</Eyebrow>
          <ul className="mt-1.5 space-y-1">
            {p.tasksNow.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-cream-base/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-[2px] bg-red" />{t}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {p.tasksLater.length ? (
        <div className="mt-4">
          <Eyebrow>/ TASKS LATER</Eyebrow>
          <ul className="mt-1.5 space-y-1">
            {p.tasksLater.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-dim">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-[2px] bg-white/25" />{t}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {p.kpis.length ? (
        <div className="mt-4">
          <Eyebrow>/ EXPECTED ACHIEVEMENTS</Eyebrow>
          <div className="mt-1.5 space-y-1.5">
            {p.kpis.map((k, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-1.5 text-sm last:border-0">
                <span className="text-cream-base/90">{k.label}</span>
                <span className="shrink-0 font-mono text-xs text-red">{k.target}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {p.budgetNote ? (
        <p className="mt-4 border-l-2 border-line2 pl-3 text-xs text-dim">{p.budgetNote}</p>
      ) : null}
    </div>
  );
}
