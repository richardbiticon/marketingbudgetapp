"use client";
import * as React from "react";
import Image from "next/image";
import { ChevronLeft, Mail, Plus, Image as ImageIcon } from "lucide-react";
import { MonthSwitcher } from "./MonthSwitcher";
import { Identity } from "./Identity";
import { ActivityNotes } from "./ActivityNotes";
import { EmailDrawer } from "./EmailDrawer";
import { SocialDrawer } from "./SocialDrawer";
import { Eyebrow, SectionLabel } from "./bits";
import { authedHeaders, getActor } from "@/lib/actor";
import { currentPeriod } from "@/lib/format";
import {
  type EmailRow, type SocialRow, TRACK_COLOR, EMAIL_STATUS_COLOR, PILLAR_COLOR, SOCIAL_STATUS_COLOR,
} from "@/lib/campaigns";
import { cn } from "@/lib/utils";

type Tab = "email" | "social";

function monthGrid(period: string) {
  const [y, m] = period.split("-").map(Number);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { lead, days };
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CampaignsApp() {
  const [period, setPeriod] = React.useState(currentPeriod());
  const [tab, setTab] = React.useState<Tab>("email");
  const [emails, setEmails] = React.useState<EmailRow[]>([]);
  const [posts, setPosts] = React.useState<SocialRow[]>([]);
  const [openEmail, setOpenEmail] = React.useState<EmailRow | null>(null);
  const [openPost, setOpenPost] = React.useState<SocialRow | null>(null);
  const [refresh, setRefresh] = React.useState(0);

  const load = React.useCallback(async (p: string) => {
    const [eRes, sRes] = await Promise.all([
      fetch(`/api/emails?month=${p}`, { cache: "no-store" }),
      fetch(`/api/social?month=${p}`, { cache: "no-store" }),
    ]);
    if (eRes.ok) setEmails((await eRes.json()).emails);
    if (sRes.ok) setPosts((await sRes.json()).posts);
  }, []);

  React.useEffect(() => { load(period); }, [period, load]);

  // Live: poll + focus, same substrate behavior as Budget.
  React.useEffect(() => {
    const id = setInterval(() => load(period), 12000);
    const onFocus = () => load(period);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [period, load]);

  const bump = () => setRefresh((n) => n + 1);

  async function addEmail(date: string) {
    const res = await fetch("/api/emails", {
      method: "POST", headers: authedHeaders(),
      body: JSON.stringify({ sendDate: date, track: "teams", platform: "Redo", subjectA: "Untitled email", status: "idea", owner: getActor() }),
    });
    if (res.ok) {
      const { email } = await res.json();
      setEmails((x) => [...x, email]);
      setOpenEmail(email);
      bump();
    }
  }

  async function addPost(date: string) {
    const res = await fetch("/api/social", {
      method: "POST", headers: authedHeaders(),
      body: JSON.stringify({ postDate: date, pillar: "Education", concept: "New post", status: "planned", owner: getActor() }),
    });
    if (res.ok) {
      const { post } = await res.json();
      setPosts((x) => [...x, post]);
      setOpenPost(post);
      bump();
    }
  }

  const { lead, days } = monthGrid(period);
  const today = todayStr();
  const emailsByDate = React.useMemo(() => {
    const m = new Map<string, EmailRow[]>();
    for (const e of emails) { if (!m.has(e.sendDate)) m.set(e.sendDate, []); m.get(e.sendDate)!.push(e); }
    return m;
  }, [emails]);
  const postsByDate = React.useMemo(() => {
    const m = new Map<string, SocialRow[]>();
    for (const p of posts) { if (!m.has(p.postDate)) m.set(p.postDate, []); m.get(p.postDate)!.push(p); }
    return m;
  }, [posts]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 pb-24 pt-7 md:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <a href="/" title="Back to Marketing OS"
            className="flex items-center gap-2 rounded-full border border-line2 bg-white/[0.03] px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-cream-base transition-colors hover:bg-white/[0.08]">
            <ChevronLeft className="h-4 w-4" /> OS
          </a>
          <Image src="/logo.png" alt="All Volleyball" width={44} height={44} className="rounded-lg" priority />
          <div>
            <Eyebrow>/ CAMPAIGNS</Eyebrow>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-cream-light">Campaign planning</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-dim md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#57c47b]" /> Live
          </span>
          <Identity />
          <MonthSwitcher period={period} onChange={setPeriod} />
        </div>
      </header>

      {/* channel tabs */}
      <div className="mb-6 flex w-full max-w-md gap-1 rounded-lg border border-line bg-ink-panel p-1">
        {([["email", "Email", Mail], ["social", "Social. Organic", ImageIcon]] as const).map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
              tab === k ? "bg-red text-white shadow-[0_8px_24px_rgba(215,23,42,.35)]" : "text-dim hover:text-cream-light"
            )}>
            <Icon className="h-3.5 w-3.5" /> {l}
          </button>
        ))}
      </div>

      {/* calendar */}
      <div className="rounded-xl border border-line bg-ink-panel p-4">
        <div className="grid grid-cols-7 gap-1.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="pb-1 text-center font-mono text-[10px] uppercase tracking-wider text-dim">{d}</div>
          ))}
          {Array.from({ length: lead }).map((_, i) => <div key={"x" + i} />)}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1;
            const date = `${period}-${String(d).padStart(2, "0")}`;
            const dayEmails = emailsByDate.get(date) ?? [];
            const dayPosts = postsByDate.get(date) ?? [];
            const items = tab === "email" ? dayEmails : dayPosts;
            const isToday = date === today;
            return (
              <div key={date}
                className={cn(
                  "group relative flex min-h-[104px] flex-col gap-1 rounded-lg border bg-ink-deep/60 p-1.5",
                  isToday ? "border-red shadow-[0_0_14px_rgba(215,23,42,.25)]" : "border-line"
                )}>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-bold", isToday ? "text-red" : "text-cream-base/80")}>{d}</span>
                  <button
                    onClick={() => (tab === "email" ? addEmail(date) : addPost(date))}
                    title={tab === "email" ? "Plan an email" : "Plan a post"}
                    className="rounded p-0.5 text-dim opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-1 overflow-hidden">
                  {tab === "email"
                    ? dayEmails.map((e) => (
                      <button key={e.id} onClick={() => setOpenEmail(e)}
                        className="flex items-center gap-1.5 rounded-md border border-line bg-white/[0.04] px-1.5 py-1 text-left transition-colors hover:bg-white/[0.1]"
                        style={{ borderLeft: `3px solid ${TRACK_COLOR[e.track] ?? "#6b7280"}` }}>
                        <Mail className="h-3 w-3 shrink-0" style={{ color: TRACK_COLOR[e.track] ?? "#6b7280" }} />
                        <span className="truncate text-[11px] leading-tight text-cream-light">{e.subjectA}</span>
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: EMAIL_STATUS_COLOR[e.status] ?? "#807868" }} title={e.status} />
                      </button>
                    ))
                    : dayPosts.map((p) => (
                      <button key={p.id} onClick={() => setOpenPost(p)}
                        className="flex items-center gap-1.5 rounded-md border border-line bg-white/[0.04] px-1.5 py-1 text-left transition-colors hover:bg-white/[0.1]"
                        style={{ borderLeft: `3px solid ${PILLAR_COLOR[p.pillar] ?? "#6b7280"}` }}>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: PILLAR_COLOR[p.pillar] ?? "#6b7280" }} />
                        <span className="truncate text-[11px] leading-tight text-cream-light">{p.concept}</span>
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SOCIAL_STATUS_COLOR[p.status] ?? "#807868" }} title={p.status} />
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
        {/* legend */}
        <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3">
          {tab === "email"
            ? Object.entries(TRACK_COLOR).map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-dim">
                <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} /> {k}
              </span>
            ))
            : Object.entries(PILLAR_COLOR).map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-dim">
                <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} /> {k}
              </span>
            ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-dim">
        Hover a date and press + to plan {tab === "email" ? "an email" : "a post"}. Click any item to open details
        {tab === "email" ? ", the test-send preview, images, and notes." : ", images, and notes."}
      </p>

      <SectionLabel>TEAM. NOTES AND ACTIVITY</SectionLabel>
      <ActivityNotes entityType="campaigns" entityId={period} refreshSignal={refresh} />

      {openEmail ? (
        <EmailDrawer
          email={openEmail}
          onClose={() => { setOpenEmail(null); bump(); }}
          onSaved={(row) => { setEmails((x) => x.map((e) => (e.id === row.id ? row : e))); setOpenEmail(row); }}
          onDeleted={(id) => { setEmails((x) => x.filter((e) => e.id !== id)); bump(); }}
        />
      ) : null}
      {openPost ? (
        <SocialDrawer
          post={openPost}
          onClose={() => { setOpenPost(null); bump(); }}
          onSaved={(row) => { setPosts((x) => x.map((p) => (p.id === row.id ? row : p))); setOpenPost(row); }}
          onDeleted={(id) => { setPosts((x) => x.filter((p) => p.id !== id)); bump(); }}
        />
      ) : null}
    </div>
  );
}
