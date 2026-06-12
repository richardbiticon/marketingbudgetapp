"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { FileText, ExternalLink } from "lucide-react";
import {
  RebuildShell, usePoll, StagePill, StatBars, InitialsAvatar,
  type CandidateRow, type PositionRow,
} from "@/components/rebuild";
import { ActivityNotes } from "@/components/ActivityNotes";
import { Eyebrow, SectionLabel } from "@/components/bits";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/input";
import { authedHeaders } from "@/lib/actor";
import { STAGES, STAGE_LABEL } from "@/lib/rebuild";

function Field({ label, value, href }: { label: string; value: React.ReactNode; href?: string | null }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.02] p-3">
      <Eyebrow>/ {label}</Eyebrow>
      {href && value ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 text-sm text-red hover:underline">
          {value} <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <p className="mt-1 text-sm text-cream-base/90">{value || <span className="text-dim">Not provided</span>}</p>
      )}
    </div>
  );
}

const SCORE_KEYS = [["skill", "Skill"], ["ai_fluency", "AI Fluency"], ["hunger", "Hunger"], ["comms", "Comms"]] as const;

export default function TalentProfile() {
  const { id } = useParams<{ id: string }>();
  const [c, setC] = React.useState<CandidateRow | null>(null);
  const [positions, setPositions] = React.useState<PositionRow[]>([]);

  usePoll(() => {
    fetch(`/api/rebuild/candidates/${id}`, { cache: "no-store" }).then(async (r) => {
      if (r.ok) setC((await r.json()).candidate);
    });
    fetch("/api/rebuild/positions", { cache: "no-store" }).then(async (r) => {
      if (r.ok) setPositions((await r.json()).positions);
    });
  }, [id]);

  async function patch(body: Record<string, unknown>) {
    const r = await fetch(`/api/rebuild/candidates/${id}`, {
      method: "PATCH", headers: authedHeaders(), body: JSON.stringify(body),
    });
    if (r.ok) setC((await r.json()).candidate);
  }

  if (!c) {
    return <main><RebuildShell eyebrow="THE REBUILD" title="Loading." backHref="/rebuild/talent" backLabel="Talent"><p className="text-sm text-dim">Pulling the profile.</p></RebuildShell></main>;
  }
  const p = c.profile ?? {};

  return (
    <main>
      <RebuildShell eyebrow="TALENT PROFILE" title={c.name} backHref="/rebuild/talent" backLabel="Talent"
        updated={{ at: c.updatedAt, by: c.updatedBy }}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* left: identity + controls */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-ink-panel p-6">
              <div className="flex items-center gap-4">
                <InitialsAvatar name={c.name} size={64} />
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-cream-light">{c.name}</p>
                  <StagePill stage={c.stage} />
                </div>
              </div>
              <div className="mt-5"><StatBars scores={c.scores} /></div>
              <div className="mt-5 space-y-3 border-t border-line pt-4">
                <div>
                  <Label>Stage</Label>
                  <Select value={c.stage} onValueChange={(v) => patch({ stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Position</Label>
                  <Select value={c.positionId ?? "pool"} onValueChange={(v) => patch({ positionId: v === "pool" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pool">Pool (unassigned)</SelectItem>
                      {positions.map((x) => <SelectItem key={x.id} value={x.id}>{x.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-ink-panel p-6">
              <Eyebrow>/ SCORES. 1 TO 5</Eyebrow>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {SCORE_KEYS.map(([k, label]) => (
                  <div key={k}>
                    <Label>{label}</Label>
                    <Select value={String((c.scores as any)?.[k] ?? "0")}
                      onValueChange={(v) => patch({ scores: { ...(c.scores ?? {}), [k]: Number(v) || undefined } })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Not scored</SelectItem>
                        {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {c.sourcePdfUrl ? (
              <a href={c.sourcePdfUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-line bg-ink-panel p-5 text-sm text-cream-light hover:bg-white/[0.04]">
                <FileText className="h-4 w-4 text-red" /> Open the source profile file
              </a>
            ) : null}
          </div>

          {/* right: everything known */}
          <div className="space-y-6 lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="EMAIL" value={c.email} />
              <Field label="LOCATION" value={c.location} />
              <Field label="EXPECTED SALARY" value={c.expectedSalary ? `$${c.expectedSalary.toLocaleString()}/mo` : null} />
              <Field label="ROLE APPLIED" value={p.role_applied} />
              <Field label="PORTFOLIO" value={c.portfolioUrl} href={c.portfolioUrl} />
              <Field label="OLJ PROFILE" value={c.oljProfileUrl} href={c.oljProfileUrl} />
              <Field label="YEARS EXPERIENCE" value={p.years_experience} />
              <Field label="AVAILABILITY" value={p.availability} />
            </div>

            {p.summary ? (
              <div className="rounded-xl border border-line bg-ink-panel p-5">
                <Eyebrow>/ SUMMARY</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed text-cream-base/90">{p.summary}</p>
              </div>
            ) : null}

            {(p.tools?.length || p.ai_tools?.length) ? (
              <div className="rounded-xl border border-line bg-ink-panel p-5">
                <Eyebrow>/ TOOLS</Eyebrow>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(p.tools ?? []).map((t: string) => (
                    <span key={t} className="rounded-full border border-line bg-white/[0.04] px-2.5 py-0.5 text-xs text-cream-base">{t}</span>
                  ))}
                  {(p.ai_tools ?? []).map((t: string) => (
                    <span key={t} className="rounded-full border border-red/40 bg-red/10 px-2.5 py-0.5 text-xs text-red">{t}</span>
                  ))}
                </div>
              </div>
            ) : null}

            {p.work_history?.length ? (
              <div className="rounded-xl border border-line bg-ink-panel p-5">
                <Eyebrow>/ WORK HISTORY</Eyebrow>
                <div className="mt-2 space-y-2">
                  {p.work_history.map((w: any, i: number) => (
                    <div key={i} className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-2 text-sm last:border-0">
                      <span className="text-cream-light">{w.role ?? "Role not provided"} <span className="text-dim">at {w.company ?? "Not provided"}</span></span>
                      <span className="shrink-0 font-mono text-xs text-dim">{w.duration ?? ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {p.answers?.length ? (
              <div className="rounded-xl border border-line bg-ink-panel p-5">
                <Eyebrow>/ APPLICATION ANSWERS</Eyebrow>
                <div className="mt-2 space-y-3">
                  {p.answers.map((a: any, i: number) => (
                    <div key={i}>
                      <p className="text-xs font-semibold text-dim">{a.question ?? "Question not provided"}</p>
                      <p className="mt-0.5 text-sm text-cream-base/90">{a.answer ?? "Not provided"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {(p.strengths?.length || p.flags?.length) ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-ink-panel p-5">
                  <Eyebrow>/ STRENGTHS</Eyebrow>
                  <ul className="mt-2 space-y-1">
                    {(p.strengths ?? []).map((s: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-cream-base/90">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-[2px] bg-[#57c47b]" />{s}
                      </li>
                    ))}
                    {!p.strengths?.length ? <li className="text-sm text-dim">Not provided</li> : null}
                  </ul>
                </div>
                <div className="rounded-xl border border-line bg-ink-panel p-5">
                  <Eyebrow>/ FLAGS</Eyebrow>
                  <ul className="mt-2 space-y-1">
                    {(p.flags ?? []).map((s: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-cream-base/90">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-[2px] bg-red" />{s}
                      </li>
                    ))}
                    {!p.flags?.length ? <li className="text-sm text-dim">Not provided</li> : null}
                  </ul>
                </div>
              </div>
            ) : null}

            <SectionLabel>NOTES</SectionLabel>
            <ActivityNotes entityType="talent" entityId={c.id} showActivity={false} />
          </div>
        </div>
      </RebuildShell>
    </main>
  );
}
