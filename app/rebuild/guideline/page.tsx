"use client";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Pencil, Check, X } from "lucide-react";
import { RebuildShell, usePoll } from "@/components/rebuild";
import { Button } from "@/components/ui/button";
import { authedHeaders } from "@/lib/actor";

interface Doc { content: string; updatedAt: string; updatedBy: string }

const MD_COMPONENTS = {
  h1: (p: any) => <h1 className="mb-4 mt-2 text-3xl font-bold tracking-tight text-cream-light" {...p} />,
  h2: (p: any) => <h2 className="mb-3 mt-8 border-b border-line pb-2 text-xl font-bold tracking-tight text-cream-light" {...p} />,
  h3: (p: any) => <h3 className="mb-2 mt-5 text-base font-bold text-cream-light" {...p} />,
  p: (p: any) => <p className="mb-3 max-w-[72ch] text-[15px] leading-relaxed text-cream-base/90" {...p} />,
  ul: (p: any) => <ul className="mb-3 space-y-1.5 pl-1" {...p} />,
  ol: (p: any) => <ol className="mb-3 list-decimal space-y-1.5 pl-6 text-[15px] text-cream-base/90" {...p} />,
  li: (p: any) => <li className="flex gap-2 text-[15px] text-cream-base/90 [ol_&]:block" {...p}>
    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-[2px] bg-red [ol_&]:hidden" />
    <span>{p.children}</span>
  </li>,
  strong: (p: any) => <strong className="font-bold text-cream-light" {...p} />,
} as const;

export default function GuidelinePage() {
  const [doc, setDoc] = React.useState<Doc | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  usePoll(() => {
    if (editing) return; // do not clobber an open editor
    fetch("/api/rebuild/guideline", { cache: "no-store" }).then(async (r) => {
      if (r.ok) setDoc((await r.json()).guideline);
    });
  }, [editing]);

  async function save() {
    setBusy(true);
    const res = await fetch("/api/rebuild/guideline", {
      method: "PUT", headers: authedHeaders(), body: JSON.stringify({ content: draft }),
    });
    setBusy(false);
    if (res.ok) { setDoc((await res.json()).guideline); setEditing(false); }
  }

  return (
    <main>
      <RebuildShell eyebrow="MMC REBUILD" title="The Guideline"
        updated={doc ? { at: doc.updatedAt, by: doc.updatedBy } : null}
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4" /> Cancel</Button>
              <Button size="sm" disabled={busy} onClick={save}><Check className="h-4 w-4" /> {busy ? "Saving." : "Save"}</Button>
            </div>
          ) : (
            <Button size="sm" variant="subtle" onClick={() => { setDraft(doc?.content ?? ""); setEditing(true); }}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )
        }>
        <div className="rounded-xl border border-line bg-ink-panel p-7 md:p-9">
          {editing ? (
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
              className="min-h-[60vh] w-full rounded-md border border-line2 bg-ink-deep p-4 font-mono text-sm leading-relaxed text-cream-light focus:border-red focus:outline-none" />
          ) : doc ? (
            <ReactMarkdown components={MD_COMPONENTS as any}>{doc.content}</ReactMarkdown>
          ) : (
            <p className="text-sm text-dim">Loading the plan.</p>
          )}
        </div>
      </RebuildShell>
    </main>
  );
}
