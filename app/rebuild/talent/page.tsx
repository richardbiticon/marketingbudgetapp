"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Plus, Upload, Search } from "lucide-react";
import {
  RebuildShell, usePoll, StagePill, StatBars, InitialsAvatar,
  type CandidateRow, type PositionRow,
} from "@/components/rebuild";
import { Eyebrow } from "@/components/bits";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { authedHeaders } from "@/lib/actor";
import { STAGES, STAGE_LABEL, EMPTY_PROFILE } from "@/lib/rebuild";
import { cn } from "@/lib/utils";

export default function TalentPool() {
  const router = useRouter();
  const [candidates, setCandidates] = React.useState<CandidateRow[]>([]);
  const [positions, setPositions] = React.useState<PositionRow[]>([]);
  const [fPos, setFPos] = React.useState("all");
  const [fStage, setFStage] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [intakeOpen, setIntakeOpen] = React.useState(false);

  usePoll(() => {
    fetch("/api/rebuild/candidates", { cache: "no-store" }).then(async (r) => {
      if (r.ok) setCandidates((await r.json()).candidates);
    });
    fetch("/api/rebuild/positions", { cache: "no-store" }).then(async (r) => {
      if (r.ok) setPositions((await r.json()).positions);
    });
  }, []);

  const posTitle = React.useMemo(() => new Map(positions.map((p) => [p.id, p.title])), [positions]);
  const shown = candidates.filter((c) => {
    if (fPos === "bench") { if (c.stage !== "bench") return false; }
    else if (fPos !== "all" && c.positionId !== fPos) return false;
    if (fStage !== "all" && c.stage !== fStage) return false;
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const benchCount = candidates.filter((c) => c.stage === "bench").length;

  return (
    <main>
      <RebuildShell eyebrow="MMC REBUILD" title="Talent Pool"
        updated={candidates[0] ? { at: candidates[0].updatedAt, by: candidates[0].updatedBy } : null}
        actions={<Button size="sm" onClick={() => setIntakeOpen(true)}><Plus className="h-4 w-4" /> Add Talent</Button>}>

        {/* filters; bench is the warm pool we call first */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button onClick={() => setFPos(fPos === "bench" ? "all" : "bench")}
            className={cn("rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
              fPos === "bench" ? "border-red bg-red text-white" : "border-line2 text-cream-base hover:bg-white/[0.05]")}>
            The Bench ({benchCount})
          </button>
          <Select value={fPos === "bench" ? "all" : fPos} onValueChange={setFPos}>
            <SelectTrigger className="h-9 w-56"><SelectValue placeholder="All positions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All positions</SelectItem>
              {positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fStage} onValueChange={setFStage}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="All stages" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className="h-9 w-48 pl-8" />
          </div>
        </div>

        {/* character-select grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c, i) => (
            <motion.button key={c.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push(`/rebuild/talent/${c.id}`)}
              className="rounded-2xl border border-line bg-ink-panel p-5 text-left transition-colors hover:border-red/50">
              <div className="flex items-start gap-3">
                <InitialsAvatar name={c.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-cream-light">{c.name}</p>
                  <p className="truncate font-mono text-[10px] uppercase tracking-wider text-dim">
                    {c.positionId ? posTitle.get(c.positionId) ?? "Unassigned" : "Pool"}
                  </p>
                </div>
                <StagePill stage={c.stage} />
              </div>
              <div className="mt-4">
                {c.scores ? <StatBars scores={c.scores} compact /> : (
                  <p className="font-mono text-[10px] uppercase tracking-wider text-dim">Not scored yet</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line2 p-10 text-center text-sm text-dim">
            Nobody matches. Clear a filter or add talent.
          </p>
        ) : null}

        {intakeOpen ? <IntakePanel positions={positions} onClose={() => setIntakeOpen(false)} /> : null}
      </RebuildShell>
    </main>
  );
}

// ---- the PDF intake pipeline ----
function IntakePanel({ positions, onClose }: { positions: PositionRow[]; onClose: () => void }) {
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<any | null>(null);
  const [sourceUrl, setSourceUrl] = React.useState<string | null>(null);
  const [positionId, setPositionId] = React.useState("pool");
  const [stage, setStage] = React.useState("applied");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(null);
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (file.size > 3_000_000) { setErr("Keep the file under 3 MB."); return; }
    setBusy(true);
    try {
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file);
      });
      const r = await fetch("/api/rebuild/extract", {
        method: "POST", headers: authedHeaders(),
        body: JSON.stringify({ filename: file.name, mime: file.type, dataBase64: dataUrl.split(",")[1] ?? "" }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.error ?? "Upload failed"); return; }
      setProfile(j.profile ?? EMPTY_PROFILE);
      setSourceUrl(j.sourceUrl ?? null);
      if (j.notice) setNotice(j.notice);
    } finally { setBusy(false); }
  }

  function manual() { setProfile({ ...EMPTY_PROFILE }); setSourceUrl(null); }

  async function saveCandidate() {
    if (!profile) return;
    setBusy(true);
    const r = await fetch("/api/rebuild/candidates", {
      method: "POST", headers: authedHeaders(),
      body: JSON.stringify({
        name: profile.name || "Unnamed candidate",
        email: profile.email, location: profile.location,
        expectedSalary: profile.expected_salary_usd,
        portfolioUrl: profile.portfolio_url, oljProfileUrl: profile.olj_profile_url,
        positionId: positionId === "pool" ? null : positionId,
        stage, profile, sourcePdfUrl: sourceUrl, source: sourceUrl ? "pdf" : "manual",
      }),
    });
    setBusy(false);
    if (r.ok) {
      const { candidate } = await r.json();
      onClose();
      router.push(`/rebuild/talent/${candidate.id}`);
    }
  }

  const setP = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((p: any) => ({ ...p, [k]: e.target.value === "" ? null : k === "expected_salary_usd" || k === "years_experience" ? Number(e.target.value) : e.target.value }));

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Talent</DialogTitle>
          <DialogDescription>The profiling pipeline. The PDF does the typing for you.</DialogDescription>
        </DialogHeader>

        {!profile ? (
          <div>
            <ol className="list-decimal space-y-1.5 pl-6 text-sm text-cream-base/90">
              <li>Open Claude and go to the team project called &quot;Talent Profiling&quot;.</li>
              <li>Drop in screenshots of everything we have on the person (application answers, portfolio pages, OnlineJobs.ph profile, chat snippets).</li>
              <li>Ask it to return the profile PDF.</li>
              <li>Upload that PDF here.</li>
            </ol>
            <div className="mt-5 rounded-lg border border-dashed border-line2 p-8 text-center">
              <Upload className="mx-auto h-6 w-6 text-dim" />
              <p className="mt-2 text-sm text-cream-base">Drop the profile PDF, or screenshots directly.</p>
              <Button className="mt-3" variant="subtle" disabled={busy} onClick={() => fileRef.current?.click()}>
                {busy ? "Extracting." : "Choose file"}
              </Button>
              <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg" className="hidden" onChange={onPick} />
              {err ? <p className="mt-3 text-sm text-red">{err}</p> : null}
            </div>
            <button onClick={manual} className="mt-3 font-mono text-[11px] uppercase tracking-wider text-dim hover:text-cream-light">
              Or enter a profile manually
            </button>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {notice ? <p className="mb-3 rounded-md border border-line bg-white/[0.03] px-3 py-2 text-xs text-dim">{notice}</p> : null}
            <Eyebrow>/ REVIEW BEFORE SAVING</Eyebrow>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label>Name</Label><Input value={profile.name ?? ""} onChange={setP("name")} placeholder="Not provided" /></div>
              <div><Label>Email</Label><Input value={profile.email ?? ""} onChange={setP("email")} placeholder="Not provided" /></div>
              <div><Label>Location</Label><Input value={profile.location ?? ""} onChange={setP("location")} placeholder="Not provided" /></div>
              <div><Label>Expected salary (USD/mo)</Label><Input inputMode="numeric" value={profile.expected_salary_usd ?? ""} onChange={setP("expected_salary_usd")} placeholder="Not provided" /></div>
              <div><Label>Portfolio URL</Label><Input value={profile.portfolio_url ?? ""} onChange={setP("portfolio_url")} placeholder="Not provided" /></div>
              <div><Label>OLJ profile URL</Label><Input value={profile.olj_profile_url ?? ""} onChange={setP("olj_profile_url")} placeholder="Not provided" /></div>
              <div><Label>Role applied</Label><Input value={profile.role_applied ?? ""} onChange={setP("role_applied")} placeholder="Not provided" /></div>
              <div><Label>Years of experience</Label><Input inputMode="numeric" value={profile.years_experience ?? ""} onChange={setP("years_experience")} placeholder="Not provided" /></div>
            </div>
            {profile.summary ? (
              <div className="mt-3"><Label>Summary</Label>
                <p className="rounded-md border border-line bg-white/[0.02] p-3 text-sm text-cream-base/90">{profile.summary}</p></div>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <Label>Assign to</Label>
                <Select value={positionId} onValueChange={setPositionId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pool">Pool (unassigned)</SelectItem>
                    {positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-5 flex justify-between">
              <Button variant="ghost" onClick={() => { setProfile(null); setNotice(null); }}>Back</Button>
              <Button disabled={busy} onClick={saveCandidate}>{busy ? "Saving." : "Save to pool"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
