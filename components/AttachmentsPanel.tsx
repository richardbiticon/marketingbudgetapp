"use client";
import * as React from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Eyebrow } from "./bits";
import { authedHeaders } from "@/lib/actor";

interface Att { id: string; filename: string; mime: string; sizeBytes: number; uploader: string; createdAt: string }

const MAX_BYTES = 2_500_000; // ~2.5 MB. Vercel's request cap is 4.5 MB after base64.

// Image uploads for any entity. Stored in Postgres, served from
// /api/attachments/[id]. Reused by emails, social posts, and anything later.
export function AttachmentsPanel({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [items, setItems] = React.useState<Att[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    const res = await fetch(`/api/attachments?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`, { cache: "no-store" });
    if (res.ok) setItems((await res.json()).attachments);
  }, [entityType, entityId]);

  React.useEffect(() => { load(); }, [load]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Images only."); return; }
    if (file.size > MAX_BYTES) { setErr("Keep images under 2.5 MB."); return; }
    setBusy(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const dataBase64 = dataUrl.split(",")[1] ?? "";
      const res = await fetch("/api/attachments", {
        method: "POST",
        headers: authedHeaders(),
        body: JSON.stringify({ entityType, entityId, filename: file.name, mime: file.type, dataBase64 }),
      });
      if (!res.ok) { setErr((await res.json()).error ?? "Upload failed"); return; }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setItems((x) => x.filter((a) => a.id !== id));
    await fetch(`/api/attachments/${id}`, { method: "DELETE", headers: authedHeaders() });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Eyebrow>/ IMAGES</Eyebrow>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border border-line2 bg-white/[0.03] px-3 py-1.5 text-xs text-cream-base transition-colors hover:bg-white/[0.08] disabled:opacity-50"
        >
          <ImagePlus className="h-3.5 w-3.5" /> {busy ? "Uploading." : "Upload image"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      </div>
      {err ? <p className="mt-2 text-xs text-red">{err}</p> : null}
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-dim">No images yet. Upload creative, screenshots, or references.</p>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {items.map((a) => (
            <div key={a.id} className="group relative overflow-hidden rounded-lg border border-line bg-ink-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/attachments/${a.id}`} alt={a.filename} className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/65 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="truncate text-[10px] text-cream-base">{a.uploader}</span>
                <button onClick={() => remove(a.id)} title="Delete" className="text-dim hover:text-red">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
