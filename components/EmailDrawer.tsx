"use client";
import * as React from "react";
import { Trash2, Mail, Eye, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input, Label, Textarea } from "./ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Eyebrow } from "./bits";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { ActivityNotes } from "./ActivityNotes";
import { scanCopy } from "@/lib/discipline";
import { authedHeaders } from "@/lib/actor";
import {
  type EmailRow, TRACKS, TRACK_LABEL, EMAIL_STATUSES, EMAIL_STATUS_COLOR,
} from "@/lib/campaigns";
import { cn } from "@/lib/utils";

function ScanNote({ text }: { text: string }) {
  const r = scanCopy(text);
  if (!text.trim()) return null;
  if (r.clean) return <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[#57c47b]">scan clean</p>;
  return (
    <ul className="mt-1 space-y-0.5">
      {r.violations.map((v, i) => (
        <li key={i} className="font-mono text-[10px] tracking-wide text-red">{v.message}</li>
      ))}
    </ul>
  );
}

interface InboundItem { id: string; subject: string; fromAddr: string | null; matchedEmailId: string | null; createdAt: string }

export function EmailDrawer({
  email,
  onClose,
  onSaved,
  onDeleted,
}: {
  email: EmailRow;
  onClose: () => void;
  onSaved: (e: EmailRow) => void;
  onDeleted: (id: string) => void;
}) {
  const [f, setF] = React.useState({
    sendDate: email.sendDate, track: email.track, platform: email.platform,
    subjectA: email.subjectA, subjectB: email.subjectB ?? "", preheader: email.preheader ?? "",
    body: email.body ?? "", status: email.status, owner: email.owner ?? "",
  });
  const [tab, setTab] = React.useState<"details" | "preview">("details");
  const [html, setHtml] = React.useState(email.html ?? "");
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const [pasteDraft, setPasteDraft] = React.useState("");
  const [inbound, setInbound] = React.useState<InboundItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const dirty =
    f.sendDate !== email.sendDate || f.track !== email.track || f.platform !== email.platform ||
    f.subjectA !== email.subjectA || f.subjectB !== (email.subjectB ?? "") ||
    f.preheader !== (email.preheader ?? "") || f.body !== (email.body ?? "") ||
    f.status !== email.status || f.owner !== (email.owner ?? "");

  function set<K extends keyof typeof f>(k: K, v: string) { setF((s) => ({ ...s, [k]: v })); }

  async function patch(p: Record<string, unknown>): Promise<EmailRow | null> {
    setBusy(true);
    try {
      const res = await fetch(`/api/emails/${email.id}`, {
        method: "PATCH", headers: authedHeaders(), body: JSON.stringify(p),
      });
      if (!res.ok) return null;
      const { email: row } = await res.json();
      onSaved(row);
      return row;
    } finally { setBusy(false); }
  }

  async function save() {
    await patch({
      sendDate: f.sendDate, track: f.track, platform: f.platform,
      subjectA: f.subjectA, subjectB: f.subjectB || null, preheader: f.preheader || null,
      body: f.body || null, status: f.status, owner: f.owner || null,
    });
  }

  async function saveHtml(value: string) {
    const row = await patch({ html: value || null });
    if (row) { setHtml(row.html ?? ""); setPasteOpen(false); setPasteDraft(""); }
  }

  async function loadInbound() {
    const res = await fetch("/api/inbound", { cache: "no-store" });
    if (res.ok) setInbound((await res.json()).inbound);
  }

  async function linkInbound(inboundId: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/inbound/link", {
        method: "POST", headers: authedHeaders(), body: JSON.stringify({ inboundId, emailId: email.id }),
      });
      if (res.ok) {
        const { email: row } = await res.json();
        setHtml(row.html ?? "");
        onSaved(row);
      }
    } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/emails/${email.id}`, { method: "DELETE", headers: authedHeaders() });
    setBusy(false);
    if (res.ok) { onDeleted(email.id); onClose(); }
  }

  const token = email.id.slice(0, 8);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-red text-white"><Mail className="h-4 w-4" /></span>
            {email.subjectA || "Email"}
          </DialogTitle>
          <DialogDescription>
            {f.sendDate} · {TRACK_LABEL[f.track] ?? f.track} · {f.platform}
          </DialogDescription>
        </DialogHeader>

        {/* tabs */}
        <div className="mb-4 flex gap-1 rounded-lg border border-line bg-ink-deep p-1">
          {([["details", "Details"], ["preview", "Email preview"]] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => { setTab(k); if (k === "preview") loadInbound(); }}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                tab === k ? "bg-red text-white" : "text-dim hover:text-cream-light"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="max-h-[58vh] overflow-y-auto pr-1">
          {tab === "details" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <Label>Send date</Label>
                  <Input type="date" value={f.sendDate} onChange={(e) => set("sendDate", e.target.value)} />
                </div>
                <div>
                  <Label>Track</Label>
                  <Select value={f.track} onValueChange={(v) => set("track", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TRACKS.map((t) => <SelectItem key={t} value={t}>{TRACK_LABEL[t]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={f.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMAIL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ background: EMAIL_STATUS_COLOR[s] }} />{s}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Platform</Label>
                  <Input value={f.platform} onChange={(e) => set("platform", e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Subject A</Label>
                <Input value={f.subjectA} onChange={(e) => set("subjectA", e.target.value)} />
                <ScanNote text={f.subjectA} />
              </div>
              <div>
                <Label>Subject B (variant)</Label>
                <Input value={f.subjectB} onChange={(e) => set("subjectB", e.target.value)} placeholder="Optional A/B variant" />
                <ScanNote text={f.subjectB} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Preheader</Label>
                  <Input value={f.preheader} onChange={(e) => set("preheader", e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <Label>Owner</Label>
                  <Input value={f.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Who runs this send" />
                </div>
              </div>
              <div>
                <Label>Copy and notes</Label>
                <Textarea value={f.body} onChange={(e) => set("body", e.target.value)} className="min-h-[110px]" placeholder="Working copy, CTA, segment, anything the team should review." />
                <ScanNote text={f.body} />
              </div>

              <AttachmentsPanel entityType="email" entityId={email.id} />

              <ActivityNotes entityType="email" entityId={email.id} showActivity={false} />
            </div>
          ) : (
            <div className="space-y-4">
              {html ? (
                <div className="overflow-hidden rounded-lg border border-line bg-white">
                  <iframe title="Email preview" sandbox="" srcDoc={html} className="h-[52vh] w-full bg-white" />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-line2 p-6 text-center">
                  <Eye className="mx-auto h-6 w-6 text-dim" />
                  <p className="mt-2 text-sm text-cream-base">No test send captured yet.</p>
                  <p className="mx-auto mt-1 max-w-[48ch] text-xs text-dim">
                    Send the Redo test email to the capture address and it appears here automatically.
                    Auto-match works if the test subject matches Subject A, or include the token
                    <span className="mx-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-cream-light">pe:{token}</span>
                    anywhere in the subject. You can also paste the email HTML below.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="subtle" size="sm" onClick={() => setPasteOpen((v) => !v)}>Paste HTML</Button>
                {html ? <Button variant="danger" size="sm" onClick={() => saveHtml("")}>Clear preview</Button> : null}
              </div>
              {pasteOpen ? (
                <div>
                  <Textarea value={pasteDraft} onChange={(e) => setPasteDraft(e.target.value)} className="min-h-[120px] font-mono text-xs" placeholder="Paste the full email HTML here (from Redo: preview the email, view source, copy)." />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" disabled={busy || !pasteDraft.trim()} onClick={() => saveHtml(pasteDraft)}>Save preview</Button>
                  </div>
                </div>
              ) : null}

              <div>
                <Eyebrow>/ CAPTURED TEST SENDS</Eyebrow>
                {inbound.length === 0 ? (
                  <p className="mt-2 text-xs text-dim">Nothing captured yet. Once the inbound address is set up, every test send shows up here.</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {inbound.map((i) => (
                      <div key={i.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-white/[0.02] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-cream-light">{i.subject || "(no subject)"}</p>
                          <p className="font-mono text-[10px] text-dim">{i.fromAddr ?? "unknown sender"}{i.matchedEmailId ? " · linked" : ""}</p>
                        </div>
                        <Button variant="outline" size="sm" disabled={busy} onClick={() => linkInbound(i.id)}>
                          <Link2 className="h-3.5 w-3.5" /> Use
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          {confirmDel ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red">Delete this email?</span>
              <Button variant="danger" size="sm" disabled={busy} onClick={remove}>Confirm</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDel(true)}><Trash2 className="h-4 w-4" /> Delete</Button>
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>Close</Button>
            <Button size="md" disabled={busy || !dirty} onClick={save}>{busy ? "Saving." : "Save changes"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
