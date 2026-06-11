"use client";
import * as React from "react";
import { Send } from "lucide-react";
import { Eyebrow } from "./bits";
import { Button } from "./ui/button";
import { Textarea } from "./ui/input";
import { authedHeaders, getActor } from "@/lib/actor";

interface CommentRow { id: string; author: string; body: string; createdAt: string }
interface ActivityRow { id: string; actor: string; action: string; summary: string; createdAt: string }

function timeAgo(iso: string): string {
  if (!iso) return "";
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

const ACTION_COLOR: Record<string, string> = {
  created: "text-[#57c47b]", updated: "text-[#e3ad36]", deleted: "text-red", commented: "text-cream-base",
};

// Self-contained activity + comments panel for one entity (the budget month).
// Polls so a tab left open catches teammates' changes. The substrate reused
// by every future module (email, pages, ads) sits on the same two endpoints.
export function ActivityNotes({
  entityType,
  entityId,
  refreshSignal = 0,
  showActivity = true,
}: {
  entityType: string;
  entityId: string;
  refreshSignal?: number;
  showActivity?: boolean;
}) {
  const [comments, setComments] = React.useState<CommentRow[]>([]);
  const [activity, setActivity] = React.useState<ActivityRow[]>([]);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const qs = `entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`;
    const [c, a] = await Promise.all([
      fetch(`/api/comments?${qs}`, { cache: "no-store" }),
      fetch(`/api/activity?${qs}&limit=40`, { cache: "no-store" }),
    ]);
    if (c.ok) setComments((await c.json()).comments);
    if (a.ok) setActivity((await a.json()).activity);
  }, [entityType, entityId]);

  React.useEffect(() => { load(); }, [load, refreshSignal]);

  // Live: poll every 12s and on window focus.
  React.useEffect(() => {
    const id = setInterval(load, 12000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [load]);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    const optimistic: CommentRow = { id: "temp", author: getActor(), body, createdAt: new Date().toISOString() };
    setComments((c) => [...c, optimistic]);
    setDraft("");
    const res = await fetch("/api/comments", {
      method: "POST", headers: authedHeaders(), body: JSON.stringify({ entityType, entityId, body }),
    });
    setBusy(false);
    if (res.ok) load(); else setComments((c) => c.filter((x) => x.id !== "temp"));
  }

  return (
    <div className={showActivity ? "grid grid-cols-1 gap-5 lg:grid-cols-2" : "grid grid-cols-1 gap-5"}>
      {/* Comments */}
      <div className="rounded-xl border border-line bg-ink-panel p-6">
        <Eyebrow>/ NOTES</Eyebrow>
        <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-sm text-dim">No notes yet. Start the thread for this month.</p>
          ) : comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-line bg-white/[0.02] p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-cream-light">{c.author}</span>
                <span className="font-mono text-[10px] text-dim">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-cream-base/90">{c.body}</p>
            </div>
          ))}
        </div>
        <form onSubmit={post} className="mt-4">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a note for the team." className="min-h-[60px]" />
          <div className="mt-2 flex justify-end">
            <Button type="submit" size="sm" disabled={busy || !draft.trim()}><Send className="h-3.5 w-3.5" /> Post</Button>
          </div>
        </form>
      </div>

      {/* Activity */}
      {showActivity ? (
      <div className="rounded-xl border border-line bg-ink-panel p-6">
        <Eyebrow>/ ACTIVITY</Eyebrow>
        <div className="mt-4 max-h-[22rem] space-y-2.5 overflow-y-auto pr-1">
          {activity.length === 0 ? (
            <p className="text-sm text-dim">No activity yet. Changes show up here, live.</p>
          ) : activity.map((a) => (
            <div key={a.id} className="flex items-baseline gap-2 text-sm">
              <span className="font-semibold text-cream-light">{a.actor}</span>
              <span className={ACTION_COLOR[a.action] ?? "text-cream-base"}>{a.summary}</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-dim">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
      ) : null}
    </div>
  );
}
