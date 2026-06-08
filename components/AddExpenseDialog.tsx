"use client";
import * as React from "react";
import { Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input, Label, Textarea } from "./ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import {
  CHANNELS, CHANNEL_LABEL, CATEGORIES, CATEGORY_LABEL, TYPES, TYPE_LABEL, STATUSES, STATUS_LABEL,
} from "@/lib/constants";
import { expenseInput, type ExpenseInput } from "@/lib/validation";
import { periodLabel } from "@/lib/format";

export function AddExpenseDialog({
  period,
  onAdd,
}: {
  period: string;
  onAdd: (input: ExpenseInput) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [f, setF] = React.useState({
    name: "", amount: "", channel: "meta", category: "team",
    type: "one_time", status: "planned", vendor: "", notes: "",
  });

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((s) => ({ ...s, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const parsed = expenseInput.safeParse({ ...f, period, amount: f.amount });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    setBusy(true);
    try {
      await onAdd(parsed.data);
      setOpen(false);
      setF({ name: "", amount: "", channel: "meta", category: "team", type: "one_time", status: "planned", vendor: "", notes: "" });
    } catch (e: any) {
      setErr(e.message ?? "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Add expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
          <DialogDescription>Adds to {periodLabel(period)}. Saved to the shared database.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="x-name">Name</Label>
            <Input id="x-name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Prospecting campaign" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="x-amount">Amount (USD)</Label>
              <Input id="x-amount" inputMode="decimal" value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Vendor</Label>
              <Input value={f.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel">
              <Select value={f.channel} onValueChange={(v) => set("channel", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => <SelectItem key={c} value={c}>{CHANNEL_LABEL[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={f.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={f.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={f.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Tag with [test] to count toward the carve-out." />
          </div>

          {err ? <p className="text-sm text-red">{err}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="md">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={busy}>{busy ? "Saving." : "Save expense"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
