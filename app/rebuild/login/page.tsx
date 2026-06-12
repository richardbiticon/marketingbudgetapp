"use client";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useAnimationControls } from "framer-motion";
import { Eyebrow } from "@/components/bits";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RebuildLogin() {
  const router = useRouter();
  const controls = useAnimationControls();
  const [pw, setPw] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/rebuild/auth", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (res.ok) { router.push("/rebuild"); router.refresh(); return; }
    const j = await res.json().catch(() => ({}));
    setErr(j.error ?? "Not it.");
    controls.start({ x: [0, -12, 12, -8, 8, -4, 4, 0], transition: { duration: 0.45 } });
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <motion.div animate={controls}
        className="w-full max-w-sm rounded-2xl border border-line2 bg-ink-panel p-8 shadow-[0_40px_120px_rgba(0,0,0,.45)]">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="All Volleyball" width={40} height={40} className="rounded-lg" />
          <Eyebrow>/ THE REBUILD</Eyebrow>
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-cream-light">The Rebuild.</h1>
        <p className="mt-1 text-sm text-dim">Rebuilding the marketing team around the core. Password gets you in.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <Input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" aria-label="Password" />
          {err ? <p className="text-sm text-red">{err}</p> : null}
          <Button type="submit" className="w-full" disabled={busy || !pw}>{busy ? "Checking." : "Enter"}</Button>
        </form>
      </motion.div>
    </main>
  );
}
