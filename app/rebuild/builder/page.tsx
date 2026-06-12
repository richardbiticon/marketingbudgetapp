"use client";
import * as React from "react";
import { Plus, Trash2, Rocket, Pause, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  RebuildShell, usePoll, timeAgo, StatusPill, PositionCard, type PositionRow,
} from "@/components/rebuild";
import { Eyebrow, SectionLabel } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { authedHeaders } from "@/lib/actor";

type Form = {
  title: string; mandate: string; payMin: string; payMax: string; payRampNote: string;
  cadence: string; budgetNote: string; tasksNow: string[]; tasksLater: string[];
  kpis: { label: string; target: string }[];
};
const emptyForm = (p?: PositionRow): Form => ({
  title: p?.title ?? "", mandate: p?.mandate ?? "",
  payMin: p?.payMin != null ? String(p.payMin) : "", payMax: p?.payMax != null ? String(p.payMax) : "",
  payRampNote: p?.payRampNote ?? "", cadence: p?.cadence ?? "", budgetNote: p?.budgetNote ?? "",
  tasksNow: p?.tasksNow?.length ? [...p.tasksNow] : [""],
  tasksLater: p?.tasksLater?.length ? [...p.tasksLater] : [""],
  kpis: p?.kpis?.length ? p.kpis.map((k) => ({ ...k })) : [{ label: "", target: "" }],
});

export default function BuilderPage() {
  const router = useRouter();
  const [positions, setPositions] = React.useState<PositionRow[]>([]);
  const [sel, setSel] = React.useState<PositionRow | null>(null);
  const [f, setF] = React.useState<Form>(emptyForm());
  const [conflict, setConflict] = React.useState(false);
  const [pushOpen, setPushOpen] = React.useState(false);
  const [pushStep, setPushStep] = React.useState(1);
  const [jobPost, setJobPost] = React.useState("");
  const [trackerUrl, setTrackerUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const r = await fetch("/api/rebuild/positions", { cache: "no-store" });
    if (!r.ok) return;
    const { positions: rows } = await r.json();
    setPositions(rows);
    setSel((cur) => {
      if (!cur) return cur;
      const fresh = rows.find((x: PositionRow) => x.id === cur.id);
      return fresh ?? cur;
    });
  }, []);
  usePoll(load, []);

  function pick(p: PositionRow) { setSel(p); setF(emptyForm(p)); setConflict(false); }

  async function createDraft() {
    const r = await fetch("/api/rebuild/positions", {
      method: "POST", headers: authedHeaders(), body: JSON.stringify({ title: "New opportunity" }),
    });
    if (r.ok) { const { position } = await r.json(); await load(); pick(position); }
  }

  // Autosave the form on blur. Stale saves get a 409 and a refresh.
  async function save(extra: Record<string, unknown> = {}) {
    if (!sel) return null;
    const body = {
      expectedUpdatedAt: sel.updatedAt,
      title: f.title || "Untitled position", mandate: f.mandate,
      payMin: f.payMin || null, payMax: f.payMax || null, payRampNote: f.payRampNote,
      cadence: f.cadence, budgetNote: f.budgetNote,
      tasksNow: f.tasksNow.map((t) => t.trim()).filter(Boolean),
      tasksLater: f.tasksLater.map((t) => t.trim()).filter(Boolean),
      kpis: f.kpis.filter((k) => k.label.trim()),
      ...extra,
    };
    const r = await fetch(`/api/rebuild/positions/${sel.id}`, {
      method: "PATCH", headers: authedHeaders(), body: JSON.stringify(body),
    });
    if (r.status === 409) {
      setConflict(true);
      await load();
      setTimeout(() => setConflict(false), 4000);
      return null;
    }
    if (!r.ok) return null;
    const { position } = await r.json();
    setSel(position);
    setPositions((x) => x.map((p) => (p.id === position.id ? { ...p, ...position } : p)));
    return position as PositionRow;
  }

  async function pushThrough() {
    setBusy(true);
    const row = await save({ status: "active", jobPost: jobPost || null, trackerUrl: trackerUrl || null });
    setBusy(false);
    if (row) { setPushOpen(false); router.push(`/rebuild/positions/${row.id}`); }
  }

  const preview: PositionRow = sel ? {
    ...sel, title: f.title, mandate: f.mandate || null,
    payMin: f.payMin ? Number(f.payMin) : null, payMax: f.payMax ? Number(f.payMax) : null,
    payRampNote: f.payRampNote || null, cadence: f.cadence || null, budgetNote: f.budgetNote || null,
    tasksNow: f.tasksNow.filter((t) => t.trim()), tasksLater: f.tasksLater.filter((t) => t.trim()),
    kpis: f.kpis.filter((k) => k.label.trim()),
  } : (null as any);

  function listEditor(key: "tasksNow" | "tasksLater", label: string) {
    return (
      <div>
        <Label>{label}</Label>
        <div className="space-y-2">
          {f[key].map((t, i) => (
            <div key={i} className="flex gap-2">
              <Input value={t} onBlur={() => save()} onChange={(e) => setF((s) => {
                const arr = [...s[key]]; arr[i] = e.target.value; return { ...s, [key]: arr };
              })} placeholder="One concrete responsibility" />
              <Button type="button" variant="ghost" size="icon" onClick={() => {
                setF((s) => ({ ...s, [key]: s[key].filter((_, j) => j !== i) })); setTimeout(() => save(), 0);
              }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="subtle" size="sm" onClick={() => setF((s) => ({ ...s, [key]: [...s[key], ""] }))}>
            <Plus className="h-4 w-4" /> Add row
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main>
      <RebuildShell eyebrow="THE REBUILD" title="Opportunity Builder"
        updated={sel ? { at: sel.updatedAt, by: sel.updatedBy } : null}
        actions={<Button size="sm" onClick={createDraft}><Plus className="h-4 w-4" /> New draft</Button>}>

        {conflict ? (
          <div className="mb-4 rounded-lg border border-red/40 bg-red/10 px-4 py-2.5 text-sm text-red">
            Someone else just edited this. Refreshing.
          </div>
        ) : null}

        {!sel ? (
          <div className="rounded-xl border border-dashed border-line2 p-10 text-center">
            <p className="text-cream-base">Pick an opportunity below or start a new draft.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* form */}
            <div className="space-y-4 rounded-xl border border-line bg-ink-panel p-6">
              <div>
                <Label>Title</Label>
                <Input value={f.title} onBlur={() => save()} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} />
              </div>
              <div>
                <Label>Mandate. The one-line ownership sentence</Label>
                <Textarea value={f.mandate} onBlur={() => save()} onChange={(e) => setF((s) => ({ ...s, mandate: e.target.value }))} className="min-h-[64px]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Pay min (USD/mo)</Label>
                  <Input inputMode="numeric" value={f.payMin} onBlur={() => save()} onChange={(e) => setF((s) => ({ ...s, payMin: e.target.value }))} />
                </div>
                <div>
                  <Label>Pay max</Label>
                  <Input inputMode="numeric" value={f.payMax} onBlur={() => save()} onChange={(e) => setF((s) => ({ ...s, payMax: e.target.value }))} />
                </div>
                <div>
                  <Label>Ramp note</Label>
                  <Input value={f.payRampNote} onBlur={() => save()} onChange={(e) => setF((s) => ({ ...s, payRampNote: e.target.value }))} placeholder="$1,500 at 90-day goals" />
                </div>
              </div>
              <div>
                <Label>Cadence. Output expectations</Label>
                <Input value={f.cadence} onBlur={() => save()} onChange={(e) => setF((s) => ({ ...s, cadence: e.target.value }))} placeholder="Daily queue, weekly review" />
              </div>
              {listEditor("tasksNow", "Tasks now")}
              {listEditor("tasksLater", "Tasks later")}
              <div>
                <Label>Expected achievements (KPIs)</Label>
                <div className="space-y-2">
                  {f.kpis.map((k, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={k.label} onBlur={() => save()} placeholder="KPI" onChange={(e) => setF((s) => {
                        const arr = s.kpis.map((x) => ({ ...x })); arr[i].label = e.target.value; return { ...s, kpis: arr };
                      })} />
                      <Input value={k.target} onBlur={() => save()} placeholder="Target" className="max-w-[180px]" onChange={(e) => setF((s) => {
                        const arr = s.kpis.map((x) => ({ ...x })); arr[i].target = e.target.value; return { ...s, kpis: arr };
                      })} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => {
                        setF((s) => ({ ...s, kpis: s.kpis.filter((_, j) => j !== i) })); setTimeout(() => save(), 0);
                      }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="subtle" size="sm" onClick={() => setF((s) => ({ ...s, kpis: [...s.kpis, { label: "", target: "" }] }))}>
                    <Plus className="h-4 w-4" /> Add KPI
                  </Button>
                </div>
              </div>
              <div>
                <Label>Budget note</Label>
                <Input value={f.budgetNote} onBlur={() => save()} onChange={(e) => setF((s) => ({ ...s, budgetNote: e.target.value }))} />
              </div>

              <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                {sel.status === "draft" ? (
                  <Button onClick={() => { setPushStep(1); setJobPost(sel.jobPost ?? ""); setTrackerUrl(sel.trackerUrl ?? ""); setPushOpen(true); }}>
                    <Rocket className="h-4 w-4" /> Push Through
                  </Button>
                ) : (
                  <>
                    {sel.status === "active" ? (
                      <Button variant="subtle" onClick={() => save({ status: "paused" })}><Pause className="h-4 w-4" /> Pause</Button>
                    ) : (
                      <Button variant="subtle" onClick={() => save({ status: "active" })}><Rocket className="h-4 w-4" /> Reactivate</Button>
                    )}
                    <Button variant="outline" onClick={() => save({ status: "filled" })}><CheckCircle2 className="h-4 w-4" /> Mark Filled</Button>
                    <Button variant="ghost" onClick={() => router.push(`/rebuild/positions/${sel.id}`)}>Open entity page</Button>
                  </>
                )}
              </div>
              <p className="text-xs text-dim">Autosaves when a field loses focus.</p>
            </div>

            {/* live preview */}
            <div>
              <Eyebrow>/ LIVE PREVIEW</Eyebrow>
              <div className="mt-2"><PositionCard p={preview} /></div>
            </div>
          </div>
        )}

        <SectionLabel>OPPORTUNITIES</SectionLabel>
        <div className="overflow-hidden rounded-xl border border-line bg-ink-panel">
          {positions.length === 0 ? (
            <p className="p-6 text-sm text-dim">Nothing yet. Start a new draft.</p>
          ) : positions.map((p) => (
            <button key={p.id} onClick={() => pick(p)}
              className="flex w-full items-center gap-4 border-b border-line/60 px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-white/[0.03]">
              <span className="flex-1 font-semibold text-cream-light">{p.title}</span>
              <span className="hidden font-mono text-[10px] uppercase tracking-wider text-dim sm:inline">
                {p.applicantCount ?? 0} applicants
              </span>
              <span className="hidden font-mono text-[10px] text-dim md:inline">edited {timeAgo(p.updatedAt)} by {p.updatedBy}</span>
              <StatusPill status={p.status} />
            </button>
          ))}
        </div>

        {/* Push Through modal */}
        {pushOpen && sel ? (
          <Dialog open onOpenChange={(o) => { if (!o) setPushOpen(false); }}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Push Through. Step {pushStep} of 2</DialogTitle>
                <DialogDescription>
                  {pushStep === 1
                    ? "Paste the job post copy. Optional but encouraged."
                    : "Paste the tracker link where applicants are collected."}
                </DialogDescription>
              </DialogHeader>
              {pushStep === 1 ? (
                <Textarea value={jobPost} onChange={(e) => setJobPost(e.target.value)} className="min-h-[180px]" placeholder="The post as it will run on OnlineJobs.ph or wherever it goes." />
              ) : (
                <Input value={trackerUrl} onChange={(e) => setTrackerUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/..." />
              )}
              <div className="mt-4 flex justify-between">
                <Button variant="ghost" onClick={() => (pushStep === 1 ? setPushOpen(false) : setPushStep(1))}>
                  {pushStep === 1 ? "Cancel" : "Back"}
                </Button>
                {pushStep === 1 ? (
                  <Button onClick={() => setPushStep(2)}>Next</Button>
                ) : (
                  <Button disabled={busy} onClick={pushThrough}><Rocket className="h-4 w-4" /> {busy ? "Activating." : "Activate"}</Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </RebuildShell>
    </main>
  );
}
