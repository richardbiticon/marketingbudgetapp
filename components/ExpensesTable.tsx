"use client";
import * as React from "react";
import { Pencil, Trash2, Check, X, Download, Search, ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { StatusPill } from "./bits";
import { AddExpenseDialog } from "./AddExpenseDialog";
import {
  CHANNELS, CHANNEL_LABEL, CATEGORIES, CATEGORY_LABEL, STATUSES, STATUS_LABEL, CATEGORY_COLOR,
} from "@/lib/constants";
import { dollars } from "@/lib/format";
import { toCSV, type ExpenseRow } from "@/lib/rollups";
import type { ExpenseInput } from "@/lib/validation";
import { cn } from "@/lib/utils";

type SortKey = "name" | "amountCents" | "channel" | "category" | "status";

export function ExpensesTable({
  rows,
  period,
  onAdd,
  onUpdate,
  onDelete,
}: {
  rows: ExpenseRow[];
  period: string;
  onAdd: (i: ExpenseInput) => Promise<void>;
  onUpdate: (id: string, patch: Partial<ExpenseInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [q, setQ] = React.useState("");
  const [fChannel, setFChannel] = React.useState("all");
  const [fCategory, setFCategory] = React.useState("all");
  const [fStatus, setFStatus] = React.useState("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("amountCents");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<any>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    let out = rows.filter((r) => {
      if (fChannel !== "all" && r.channel !== fChannel) return false;
      if (fCategory !== "all" && r.category !== fCategory) return false;
      if (fStatus !== "all" && r.status !== fStatus) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!r.name.toLowerCase().includes(s) && !(r.vendor ?? "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return out;
  }, [rows, q, fChannel, fCategory, fStatus, sortKey, sortDir]);

  function sort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "amountCents" ? "desc" : "asc"); }
  }

  function startEdit(r: ExpenseRow) {
    setConfirmId(null);
    setEditId(r.id);
    setDraft({
      name: r.name, amount: (r.amountCents / 100).toString(),
      channel: r.channel, category: r.category, status: r.status, vendor: r.vendor ?? "",
    });
  }
  async function saveEdit(id: string) {
    await onUpdate(id, {
      name: draft.name, amount: Number(draft.amount), channel: draft.channel,
      category: draft.category, status: draft.status, vendor: draft.vendor || null,
    });
    setEditId(null); setDraft(null);
  }

  function exportCSV() {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `avb-budget-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink-panel">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or vendor" className="h-9 w-56 pl-8" />
        </div>
        <FilterSelect value={fChannel} onChange={setFChannel} placeholder="Channel"
          options={[["all", "All channels"], ...CHANNELS.map((c) => [c, CHANNEL_LABEL[c]] as [string, string])]} />
        <FilterSelect value={fCategory} onChange={setFCategory} placeholder="Category"
          options={[["all", "All categories"], ...CATEGORIES.map((c) => [c, CATEGORY_LABEL[c]] as [string, string])]} />
        <FilterSelect value={fStatus} onChange={setFStatus} placeholder="Status"
          options={[["all", "All statuses"], ...STATUSES.map((s) => [s, STATUS_LABEL[s]] as [string, string])]} />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="subtle" size="sm" onClick={exportCSV}><Download className="h-4 w-4" /> CSV</Button>
          <AddExpenseDialog period={period} onAdd={onAdd} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-dim">
              <Th onClick={() => sort("name")}>Name</Th>
              <th className="px-4 py-3 font-normal">Vendor</th>
              <Th onClick={() => sort("channel")}>Channel</Th>
              <Th onClick={() => sort("category")}>Category</Th>
              <Th onClick={() => sort("amountCents")} className="text-right">Amount</Th>
              <Th onClick={() => sort("status")}>Status</Th>
              <th className="px-4 py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-dim">No expenses match. Add one to get started.</td></tr>
            ) : filtered.map((r) => {
              const editing = editId === r.id;
              return (
                <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]">
                  {editing ? (
                    <>
                      <td className="px-4 py-2"><Input className="h-8" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></td>
                      <td className="px-4 py-2"><Input className="h-8" value={draft.vendor} onChange={(e) => setDraft({ ...draft, vendor: e.target.value })} /></td>
                      <td className="px-4 py-2"><MiniSelect value={draft.channel} onChange={(v) => setDraft({ ...draft, channel: v })} options={CHANNELS.map((c) => [c, CHANNEL_LABEL[c]])} /></td>
                      <td className="px-4 py-2"><MiniSelect value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} options={CATEGORIES.map((c) => [c, CATEGORY_LABEL[c]])} /></td>
                      <td className="px-4 py-2"><Input className="h-8 text-right" inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} /></td>
                      <td className="px-4 py-2"><MiniSelect value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} options={STATUSES.map((s) => [s, STATUS_LABEL[s]])} /></td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          <IconBtn onClick={() => saveEdit(r.id)} title="Save"><Check className="h-4 w-4 text-[#57c47b]" /></IconBtn>
                          <IconBtn onClick={() => { setEditId(null); setDraft(null); }} title="Cancel"><X className="h-4 w-4" /></IconBtn>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-cream-light">{r.name}</td>
                      <td className="px-4 py-3 text-dim">{r.vendor || ""}</td>
                      <td className="px-4 py-3 text-cream-base/80">{CHANNEL_LABEL[r.channel]}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-[2px]" style={{ background: CATEGORY_COLOR[r.category] }} />
                          {CATEGORY_LABEL[r.category]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-cream-light">{dollars(r.amountCents)}</td>
                      <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {confirmId === r.id ? (
                            <>
                              <button onClick={async () => { await onDelete(r.id); setConfirmId(null); }} className="rounded px-2 py-1 text-xs font-medium text-red hover:bg-red/10">Confirm</button>
                              <button onClick={() => setConfirmId(null)} className="rounded px-2 py-1 text-xs text-dim hover:bg-white/5">Cancel</button>
                            </>
                          ) : (
                            <>
                              <IconBtn onClick={() => startEdit(r)} title="Edit"><Pencil className="h-4 w-4" /></IconBtn>
                              <IconBtn onClick={() => setConfirmId(r.id)} title="Delete"><Trash2 className="h-4 w-4" /></IconBtn>
                            </>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-dim">
        {filtered.length} {filtered.length === 1 ? "row" : "rows"}
      </div>
    </div>
  );
}

function Th({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <th className={cn("px-4 py-3 font-normal", className)}>
      <button onClick={onClick} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-cream-light">
        {children}
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      </button>
    </th>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="grid h-8 w-8 place-items-center rounded-md text-dim hover:bg-white/5 hover:text-white transition-colors">
      {children}
    </button>
  );
}

function FilterSelect({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: string[][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-40"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function MiniSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}
