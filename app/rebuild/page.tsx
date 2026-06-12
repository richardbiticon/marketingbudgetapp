"use client";
import * as React from "react";
import { BookOpen, Hammer, Briefcase, Users } from "lucide-react";
import { RebuildShell, usePoll, type PositionRow, type CandidateRow } from "@/components/rebuild";
import { cn } from "@/lib/utils";

type Card = {
  href: string; title: string; glance: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "ink" | "red" | "cream"; badgeKey?: "open" | "talent";
};
const CARDS: Card[] = [
  { href: "/rebuild/guideline", title: "Guideline", glance: "THE FULL REBUILD PLAN", icon: BookOpen, tone: "ink" },
  { href: "/rebuild/builder", title: "Builder", glance: "DESIGN AND ACTIVATE ROLES", icon: Hammer, tone: "red" },
  { href: "/rebuild/positions", title: "Positions", glance: "THE ROLE ENTITIES", icon: Briefcase, tone: "cream", badgeKey: "open" },
  { href: "/rebuild/talent", title: "Talent Pool", glance: "CHARACTER SELECT", icon: Users, tone: "ink", badgeKey: "talent" },
];

export default function RebuildHome() {
  const [openCount, setOpenCount] = React.useState(0);
  const [talentCount, setTalentCount] = React.useState(0);

  usePoll(() => {
    fetch("/api/rebuild/positions", { cache: "no-store" }).then(async (r) => {
      if (!r.ok) return;
      const { positions } = await r.json() as { positions: PositionRow[] };
      setOpenCount(positions.filter((p) => p.status === "active").length);
    });
    fetch("/api/rebuild/candidates", { cache: "no-store" }).then(async (r) => {
      if (!r.ok) return;
      const { candidates } = await r.json() as { candidates: CandidateRow[] };
      setTalentCount(candidates.length);
    });
  }, []);

  return (
    <main>
      <RebuildShell eyebrow="MMC REBUILD" title="The planning room" backHref="/" backLabel="OS">
        <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {CARDS.map((c, i) => {
            const badge = c.badgeKey === "open" ? openCount : c.badgeKey === "talent" ? talentCount : 0;
            const Icon = c.icon;
            return (
              <a key={c.href} href={c.href}
                style={{ animation: `fade-in .4s ${i * 0.05}s both cubic-bezier(.2,.7,.2,1)` }}
                className={cn(
                  "relative flex min-h-[150px] flex-col rounded-2xl border p-5 transition-transform hover:-translate-y-1",
                  c.tone === "red"
                    ? "border-transparent bg-gradient-to-br from-[#d8203b] to-[#a50d26] text-white"
                    : "border-line bg-ink-panel text-cream-light",
                )}>
                <span className={cn("grid h-11 w-11 place-items-center rounded-xl",
                  c.tone === "red" ? "bg-white/20" : "bg-red text-white")}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1" />
                <span className="text-lg font-bold tracking-tight">{c.title}</span>
                <span className={cn("mt-1 font-mono text-[10px] uppercase tracking-wider",
                  c.tone === "red" ? "text-white/80" : "text-dim")}>{c.glance}</span>
                {badge ? (
                  <span className={cn(
                    "absolute right-4 top-4 grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold",
                    c.tone === "red" ? "bg-white text-red" : "bg-red text-white")}>
                    {badge}
                  </span>
                ) : null}
              </a>
            );
          })}
        </div>
        <p className="mt-6 max-w-xl text-sm text-dim">
          Five hires, a monthly recruiting engine, and a visual talent pool. Design the role in the
          Builder, push it through, track applicants on the position, and keep the bench warm.
        </p>
      </RebuildShell>
    </main>
  );
}
