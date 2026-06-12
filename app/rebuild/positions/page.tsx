"use client";
import * as React from "react";
import { RebuildShell, usePoll, timeAgo, StatusPill, type PositionRow } from "@/components/rebuild";

export default function PositionsIndex() {
  const [positions, setPositions] = React.useState<PositionRow[]>([]);
  usePoll(() => {
    fetch("/api/rebuild/positions", { cache: "no-store" }).then(async (r) => {
      if (r.ok) setPositions((await r.json()).positions);
    });
  }, []);

  const latest = positions[0];
  return (
    <main>
      <RebuildShell eyebrow="THE REBUILD" title="Positions"
        updated={latest ? { at: latest.updatedAt, by: latest.updatedBy } : null}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {positions.map((p, i) => (
            <a key={p.id} href={`/rebuild/positions/${p.id}`}
              style={{ animation: `fade-in .4s ${i * 0.04}s both cubic-bezier(.2,.7,.2,1)` }}
              className="rounded-xl border border-line bg-ink-panel p-5 transition-transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight text-cream-light">{p.title}</h2>
                <StatusPill status={p.status} />
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm text-dim">{p.mandate ?? "Mandate not written yet."}</p>
              <div className="mt-4 flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-dim">
                <span>{p.applicantCount ?? 0} applicants</span>
                <span>
                  {p.payMin || p.payMax ? `$${p.payMin ?? 0} to $${p.payMax ?? 0}/mo` : "pay not set"}
                </span>
                <span className="ml-auto">edited {timeAgo(p.updatedAt)}</span>
              </div>
            </a>
          ))}
        </div>
        {positions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line2 p-10 text-center text-sm text-dim">
            No positions yet. Design one in the Builder.
          </p>
        ) : null}
      </RebuildShell>
    </main>
  );
}
