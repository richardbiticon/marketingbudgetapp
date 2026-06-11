"use client";
import * as React from "react";
import { Trash2, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input, Label, Textarea } from "./ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { ActivityNotes } from "./ActivityNotes";
import { scanCopy } from "@/lib/discipline";
import { authedHeaders } from "@/lib/actor";
import { type SocialRow, PILLARS, PILLAR_COLOR, SOCIAL_STATUSES, SOCIAL_STATUS_COLOR } from "@/lib/campaigns";

function ScanNote({ text }: { text: string }) {
  const r = scanCopy(text);
  if (!text.trim() || r.clean) return null;
  return (
    <ul className="mt-1 space-y-0.5">
      {r.violations.map((v, i) => <li key={i} className="font-mono text-[10px] tracking-wide text-red">{v.message}</li>)}
    </ul>
  );
}

export function SocialDrawer({
  post,
  onClose,
  onSaved,
  onDeleted,
}: {
  post: SocialRow;
  onClose: () => void;
  onSaved: (p: SocialRow) => void;
  onDeleted: (id: string) => void;
}) {
  const [f, setF] = React.useState({
    postDate: post.postDate, pillar: post.pillar, concept: post.concept,
    caption: post.caption ?? "", format: post.format ?? "", status: post.status, owner: post.owner ?? "",
  });
  const [busy, setBusy] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  function set<K extends keyof typeof f>(k: K, v: string) { setF((s) => ({ ...s, [k]: v })); }

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/social/${post.id}`, {
      method: "PATCH", headers: authedHeaders(),
      body: JSON.stringify({
        postDate: f.postDate, pillar: f.pillar, concept: f.concept,
        caption: f.caption || null, format: f.format || null, status: f.status, owner: f.owner || null,
      }),
    });
    setBusy(false);
    if (res.ok) onSaved((await res.json()).post);
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/social/${post.id}`, { method: "DELETE", headers: authedHeaders() });
    setBusy(false);
    if (res.ok) { onDeleted(post.id); onClose(); }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: PILLAR_COLOR[f.pillar] ?? "#6b7280" }}>
              <ImageIcon className="h-4 w-4" />
            </span>
            {post.concept}
          </DialogTitle>
          <DialogDescription>{f.postDate} · {f.pillar}{f.format ? ` · ${f.format}` : ""}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <Label>Post date</Label>
              <Input type="date" value={f.postDate} onChange={(e) => set("postDate", e.target.value)} />
            </div>
            <div>
              <Label>Pillar</Label>
              <Select value={f.pillar} onValueChange={(v) => set("pillar", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PILLARS.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: PILLAR_COLOR[p] }} />{p}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOCIAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: SOCIAL_STATUS_COLOR[s] }} />{s}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <Input value={f.format} onChange={(e) => set("format", e.target.value)} placeholder="Reel, carousel, photo" />
            </div>
          </div>

          <div>
            <Label>Concept</Label>
            <Input value={f.concept} onChange={(e) => set("concept", e.target.value)} />
            <ScanNote text={f.concept} />
          </div>
          <div>
            <Label>Caption</Label>
            <Textarea value={f.caption} onChange={(e) => set("caption", e.target.value)} className="min-h-[100px]" placeholder="The caption or hook. Runs through the discipline scan." />
            <ScanNote text={f.caption} />
          </div>
          <div className="max-w-xs">
            <Label>Owner</Label>
            <Input value={f.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Who posts it" />
          </div>

          <AttachmentsPanel entityType="social" entityId={post.id} />
          <ActivityNotes entityType="social" entityId={post.id} showActivity={false} />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          {confirmDel ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red">Delete this post?</span>
              <Button variant="danger" size="sm" disabled={busy} onClick={remove}>Confirm</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDel(true)}><Trash2 className="h-4 w-4" /> Delete</Button>
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>Close</Button>
            <Button size="md" disabled={busy} onClick={save}>{busy ? "Saving." : "Save changes"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
