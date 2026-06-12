"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Upload, Pause, Rocket, CheckCircle2, ExternalLink } from "lucide-react";
import {
  RebuildShell, usePoll, timeAgo, StagePill, PositionCard,
  type PositionRow, type CandidateRow, type RebuildEventRow,
} from "@/components/rebuild";
import { Eyebrow } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { authedHeaders } from "@/lib/actor";
import { STAGES, STAGE_LABEL } from "@/lib/rebuild";
import { cn } from "@/lib/utils";

type Tab = "overview" | "applicants" | "hires" | "history";
const EVENT_TEXT: Record<string, string> = {
  created: "created the position", edited: "edited the position", activated: "activated it",
  paused: "paused it", filled: "marked it filled", post_attached: "attached the job post",
  tracker_attached: "attached the tracker", csv_imported: "imported a CSV",
  candidate_added: "added a candidate", stage_changed: "moved a candidate", hired: "marked a hire", note: "noted",
};

export default function PositionEntityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>("overview");
  const [position, setPosition] = React.useState<PositionRow | null>(null);
  const [candidates, setCandidates] = React.useState<CandidateRow[]>([]);
  const [events, setEvents] = React.useState<RebuildEventRow[]>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);

  usePoll(() => {
    fetch(`/api/rebuild/positions/${id}`, { cache: "no-store" }).then(async (r) => {
      if (!r.ok) return;
      const j = await r.json();
      setPosition(j.position); setCandidates(j.candidates); setEvents(j.events);
    });
  }, [id]);

  async function setStatus(status: string) {
    if (!position) return;
    const r = await fetch(`/api/rebuild/positions/${id}`, {
      method: "PATCH", headers: authedHeaders(), body: JSON.stringify({ status }),
    });
    if (r.ok) setPosition((await r.json()).position);
  }

  async function setStage(c: CandidateRow, stage: string) {
    setCandidates((x) => x.map((y) => (y.id === c.id ? { ...y, stage } : y)));
    await fetch(`/api/rebuild/candidates/${c.id}`, {
      method: "PATCH", headers: authedHeaders(), body: JSON.stringify({ stage }),
    });
  }

  const hires = candidates.filter((c) => c.stage === "hired");
  const tabs: [Tab, string, number | null][] = [
    ["overview", "Overview", null],
    ["applicants", "Applicants", candidates.length],
    ["hires", "Hires", hires.length],
    ["history", "History", events.length],
  ];

  if (!position) {
    return <main><RebuildShell eyebrow="THE REBUILD" title="Loading."><p className="text-sm text-dim">Pulling the position.</p></RebuildShell></main>;
  }

  return (
    <main>
      <RebuildShell eyebrow={`POSITION · ${position.status.toUpperCase()}`} title={position.title}
        backHref="/rebuild/positions" backLabel="Positions"
        updated={{ at: position.updatedAt, by: position.updatedBy }}>

        <div className="mb-6 flex w-full max-w-2xl gap-1 rounded-lg border border-line bg-ink-panel p-1">
          {tabs.map(([k, l, n]) => (
            <button key={k} onClick={() => setTab(k)}
              className={cn("flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
                tab === k ? "bg-red text-white" : "text-dim hover:text-cream-light")}>
              {l}{n != null ? <span className="rounded-full bg-white/15 px-1.5 text-[10px]">{n}</span> : null}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><PositionCard p={position} /></div>
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-ink-panel p-5">
                <Eyebrow>/ STATUS CONTROLS</Eyebrow>
                <div className="mt-3 flex flex-wrap gap-2">
                  {position.status === "active" ? (
                    <Button size="sm" variant="subtle" onClick={() => setStatus("paused")}><Pause className="h-4 w-4" /> Pause</Button>
                  ) : (
                    <Button size="sm" variant="subtle" onClick={() => setStatus("active")}><Rocket className="h-4 w-4" /> Activate</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setStatus("filled")}><CheckCircle2 className="h-4 w-4" /> Mark Filled</Button>
                  <Button size="sm" variant="ghost" onClick={() => router.push("/rebuild/builder")}>Edit in Builder</Button>
                </div>
              </div>
              {position.trackerUrl ? (
                <a href={position.trackerUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-line bg-ink-panel p-5 text-sm text-cream-light hover:bg-white/[0.04]">
                  <ExternalLink className="h-4 w-4 text-red" /> Open the applicant tracker
                </a>
              ) : null}
              {position.jobPost ? (
                <details className="rounded-xl border border-line bg-ink-panel p-5">
                  <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-dim">/ JOB POST</summary>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-cream-base/90">{position.jobPost}</p>
                </details>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === "applicants" ? (
          <div className="overflow-hidden rounded-xl border border-line bg-ink-panel">
            <div className="flex items-center justify-end gap-2 border-b border-line p-3">
              <Button size="sm" variant="subtle" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" /> Import CSV</Button>
              <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add applicant</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-dim">
                    <th className="px-4 py-3 font-normal">Name</th>
                    <th className="px-4 py-3 font-normal">Stage</th>
                    <th className="px-4 py-3 font-normal">Scores</th>
                    <th className="px-4 py-3 font-normal">Expected</th>
                    <th className="px-4 py-3 font-normal">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-dim">No applicants yet. Add one or import the tracker CSV.</td></tr>
                  ) : candidates.map((c) => (
                    <tr key={c.id} className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-white/[0.03]"
                      onClick={() => router.push(`/rebuild/talent/${c.id}`)}>
                      <td className="px-4 py-3 font-semibold text-cream-light">{c.name}
                        <span className="ml-2 font-mono text-[9px] uppercase text-dim">{c.source}</span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Select value={c.stage} onValueChange={(v) => setStage(c, v)}>
                          <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-dim">
                        {c.scores ? `S${c.scores.skill ?? "-"} A${c.scores.ai_fluency ?? "-"} H${c.scores.hunger ?? "-"} C${c.scores.comms ?? "-"}` : "Not scored"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-cream-base/90">{c.expectedSalary ? `$${c.expectedSalary}/mo` : ""}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <span className="flex gap-2 font-mono text-[10px] uppercase">
                          {c.portfolioUrl ? <a className="text-red hover:underline" href={c.portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a> : null}
                          {c.oljProfileUrl ? <a className="text-red hover:underline" href={c.oljProfileUrl} target="_blank" rel="noreferrer">OLJ</a> : null}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === "hires" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {hires.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line2 p-10 text-center text-sm text-dim md:col-span-2">
                No hires on this position yet. The roster builds here over time.
              </p>
            ) : hires.map((c) => (
              <a key={c.id} href={`/rebuild/talent/${c.id}`} className="rounded-xl border border-line bg-ink-panel p-5 hover:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cream-light">{c.name}</span>
                  <StagePill stage={c.stage} />
                </div>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-dim">
                  Hired {timeAgo(c.updatedAt)}{c.expectedSalary ? ` · $${c.expectedSalary}/mo` : ""}
                </p>
              </a>
            ))}
          </div>
        ) : null}

        {tab === "history" ? (
          <div className="rounded-xl border border-line bg-ink-panel p-6">
            <div className="space-y-2.5">
              {events.length === 0 ? <p className="text-sm text-dim">Nothing yet.</p> : events.map((e) => (
                <div key={e.id} className="flex items-baseline gap-2 text-sm">
                  <span className="font-semibold text-cream-light">{e.actor}</span>
                  <span className="text-cream-base/80">
                    {EVENT_TEXT[e.type] ?? e.type}
                    {e.payload?.name ? ` · ${e.payload.name}` : ""}
                    {e.payload?.to ? ` to ${STAGE_LABEL[e.payload.to] ?? e.payload.to}` : ""}
                    {e.payload?.rows != null ? ` · ${e.payload.rows} rows` : ""}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-dim">{timeAgo(e.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {addOpen ? <AddApplicant positionId={position.id} onClose={() => setAddOpen(false)} onAdded={(c) => setCandidates((x) => [c, ...x])} /> : null}
        {importOpen ? <ImportCsv positionId={position.id} onClose={() => setImportOpen(false)} /> : null}
      </RebuildShell>
    </main>
  );
}

function AddApplicant({ positionId, onClose, onAdded }: { positionId: string; onClose: () => void; onAdded: (c: CandidateRow) => void }) {
  const [f, setF] = React.useState({ name: "", email: "", location: "", expectedSalary: "", portfolioUrl: "", oljProfileUrl: "", notes: "" });
  const [busy, setBusy] = React.useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const r = await fetch("/api/rebuild/candidates", {
      method: "POST", headers: authedHeaders(),
      body: JSON.stringify({ ...f, positionId, stage: "applied" }),
    });
    setBusy(false);
    if (r.ok) { onAdded((await r.json()).candidate); onClose(); }
  }
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add applicant</DialogTitle><DialogDescription>Manual entry. Starts at Applied.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Name</Label><Input value={f.name} onChange={set("name")} autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input value={f.email} onChange={set("email")} /></div>
            <div><Label>Location</Label><Input value={f.location} onChange={set("location")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Expected (USD/mo)</Label><Input inputMode="numeric" value={f.expectedSalary} onChange={set("expectedSalary")} /></div>
            <div><Label>Portfolio URL</Label><Input value={f.portfolioUrl} onChange={set("portfolioUrl")} /></div>
          </div>
          <div><Label>OnlineJobs.ph profile</Label><Input value={f.oljProfileUrl} onChange={set("oljProfileUrl")} /></div>
          <div><Label>Notes</Label><Textarea value={f.notes} onChange={set("notes")} className="min-h-[60px]" /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy || !f.name.trim()}>{busy ? "Saving." : "Add"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const TARGET_OPTIONS = [
  ["skip", "Skip"], ["name", "Name"], ["email", "Email"], ["location", "Location"],
  ["expectedSalary", "Expected salary"], ["portfolioUrl", "Portfolio URL"], ["oljProfileUrl", "OLJ profile"], ["answers", "Answers"],
] as const;

function ImportCsv({ positionId, onClose }: { positionId: string; onClose: () => void }) {
  const [csvText, setCsvText] = React.useState<string | null>(null);
  const [filename, setFilename] = React.useState("import.csv");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<number | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function guess(h: string): string {
    const l = h.toLowerCase();
    if (l.includes("name")) return "name";
    if (l.includes("mail")) return "email";
    if (l.includes("location") || l.includes("city")) return "location";
    if (l.includes("salary") || l.includes("rate") || l.includes("expected")) return "expectedSalary";
    if (l.includes("portfolio")) return "portfolioUrl";
    if (l.includes("olj") || l.includes("onlinejobs")) return "oljProfileUrl";
    return "answers";
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    const text = await file.text();
    setCsvText(text); setFilename(file.name);
    setBusy(true);
    const r = await fetch("/api/rebuild/import", {
      method: "POST", headers: authedHeaders(), body: JSON.stringify({ csvText: text }),
    });
    setBusy(false);
    if (r.ok) {
      const j = await r.json();
      setHeaders(j.headers); setRowCount(j.rowCount);
      setMapping(Object.fromEntries(j.headers.map((h: string) => [h, guess(h)])));
    }
  }

  async function runImport() {
    setBusy(true);
    const r = await fetch("/api/rebuild/import", {
      method: "POST", headers: authedHeaders(),
      body: JSON.stringify({ positionId, filename, csvText, mapping }),
    });
    setBusy(false);
    if (r.ok) setDone((await r.json()).imported);
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>Export the tracker sheet as CSV, upload it, and map the columns.</DialogDescription>
        </DialogHeader>
        {done != null ? (
          <div className="py-6 text-center">
            <p className="text-lg font-bold text-cream-light">{done} applicants imported.</p>
            <Button className="mt-4" onClick={onClose}>Done</Button>
          </div>
        ) : !csvText || headers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line2 p-8 text-center">
            <Button variant="subtle" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> {busy ? "Reading." : "Choose CSV file"}
            </Button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onPick} />
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-dim">{rowCount} rows detected. Map each column to a field.</p>
            <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
              {headers.map((h) => (
                <div key={h} className="flex items-center gap-3">
                  <span className="w-1/2 truncate text-sm text-cream-light" title={h}>{h}</span>
                  <Select value={mapping[h] ?? "skip"} onValueChange={(v) => setMapping((m) => ({ ...m, [h]: v }))}>
                    <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TARGET_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button disabled={busy || !Object.values(mapping).includes("name")} onClick={runImport}>
                {busy ? "Importing." : `Import ${rowCount} rows`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
