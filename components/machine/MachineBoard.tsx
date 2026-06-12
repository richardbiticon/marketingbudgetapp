"use client";
import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ChevronLeft, Save, Link2, Trash2, ZoomIn, ZoomOut, Maximize2, Plus,
  ClipboardList, Phone, ShoppingCart, Mail, PhoneCall, HelpCircle, X, UserPlus,
  ExternalLink,
} from "lucide-react";
import { Identity } from "../Identity";
import { ThemeToggle } from "../ThemeToggle";
import { Eyebrow } from "../bits";
import { Button } from "../ui/button";
import { Input, Label } from "../ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { authedHeaders } from "@/lib/actor";
import {
  type BoardData, type MachineNode, type NodeType,
  ENDPOINT_KINDS, NODE_SIZE,
} from "@/lib/machine";
import { cn } from "@/lib/utils";

const WORLD = { w: 3000, h: 1600 };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

interface PositionLite {
  id: string; title: string; status: string; applicantCount: number;
  mandate?: string | null; tasksNow?: string[];
}

const ENDPOINT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  contact_form: ClipboardList, call: Phone, purchase: ShoppingCart, email_us: Mail, call_form: PhoneCall,
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
  return Math.floor(m / 60) + "h ago";
}

/* ---------- sprites ---------- */
function PersonSprite({ hired, bob = 0 }: { hired: boolean; bob?: number }) {
  const c = hired ? "#57c47b" : "#D7172A";
  return (
    <span className={bob === 1 ? "machine-bob" : bob === 2 ? "machine-bob2" : undefined}>
      <svg viewBox="0 0 64 72" className="h-16 w-14">
        <ellipse cx="32" cy="66" rx="20" ry="5" fill={c} opacity=".18" />
        {!hired ? <circle cx="32" cy="34" r="29" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="4 5" opacity=".6" /> : null}
        <circle cx="32" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="3.4" />
        <path d="M32 23 V45 M32 30 L18 38 M32 30 L46 38 M32 45 L21 62 M32 45 L43 62"
          fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="50" cy="10" r="5.5" fill={c} />
        {hired
          ? <path d="M47.4 10 l1.8 1.9 3.4-3.7" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          : <text x="50" y="13" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">!</text>}
      </svg>
    </span>
  );
}
function RockSprite({ done }: { done: boolean }) {
  return (
    <svg viewBox="0 0 80 52" className="h-12 w-[4.5rem]">
      <ellipse cx="40" cy="47" rx="30" ry="4.5" fill="currentColor" opacity=".15" />
      <path d="M14 44 L8 30 L18 14 L36 7 L58 10 L72 26 L66 44 Z"
        fill={done ? "rgba(87,196,123,.22)" : "rgba(128,128,128,.25)"}
        stroke={done ? "#57c47b" : "currentColor"} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M30 14 L36 26 M48 12 L44 24" stroke="currentColor" strokeWidth="1.6" opacity=".45" />
      {done ? <path d="M30 28 l7 7 13-14" stroke="#57c47b" strokeWidth="4" fill="none" strokeLinecap="round" /> : null}
    </svg>
  );
}
function EngineSprite() {
  return (
    <svg viewBox="0 0 96 64" className="h-14 w-24">
      <ellipse cx="48" cy="60" rx="38" ry="4" fill="currentColor" opacity=".15" />
      <path d="M14 58 V30 L34 20 V30 L54 20 V30 L82 30 V58 Z"
        fill="rgba(215,23,42,.12)" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
      <rect x="20" y="12" width="7" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="24" cy="7" r="2.6" fill="currentColor" opacity=".35" className="machine-smoke" />
      <circle cx="29" cy="2" r="2" fill="currentColor" opacity=".22" className="machine-smoke2" />
      <circle cx="64" cy="44" r="9" fill="none" stroke="#D7172A" strokeWidth="2.8" className="machine-gear" style={{ transformOrigin: "64px 44px" }} />
      <path d="M64 32 v-4 M64 56 v4 M52 44 h-4 M76 44 h4 M55.5 35.5 l-2.8-2.8 M72.5 52.5 l2.8 2.8 M55.5 52.5 l-2.8 2.8 M72.5 35.5 l2.8-2.8"
        stroke="#D7172A" strokeWidth="2.4" strokeLinecap="round" className="machine-gear" style={{ transformOrigin: "64px 44px" }} />
      <rect x="22" y="38" width="14" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

/* ====================================================================== */
export function MachineBoard() {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [board, setBoard] = React.useState<BoardData>({ nodes: [], edges: [] });
  const [meta, setMeta] = React.useState<{ updatedAt: string; updatedBy: string } | null>(null);
  const [positions, setPositions] = React.useState<PositionLite[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [pan, setPan] = React.useState({ x: 40, y: 30 });
  const [scale, setScale] = React.useState(0.7);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = React.useState<string | null>(null);
  const [placing, setPlacing] = React.useState<{ type: NodeType; endpointKind?: string } | null>(null);
  const [ghost, setGhost] = React.useState<{ x: number; y: number } | null>(null);
  const [linking, setLinking] = React.useState<string | null>(null);
  const [portalPicker, setPortalPicker] = React.useState(false);
  const [legend, setLegend] = React.useState(false);
  const [spawnOpen, setSpawnOpen] = React.useState(false);
  const [sheetId, setSheetId] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">("idle");
  const [banner, setBanner] = React.useState<{ kind: "stale" | "conflict"; by: string } | null>(null);

  const dirtyRef = React.useRef(dirty); dirtyRef.current = dirty;
  const metaRef = React.useRef(meta); metaRef.current = meta;
  const scaleRef = React.useRef(scale); scaleRef.current = scale;
  const panRef = React.useRef(pan); panRef.current = pan;
  const drag = React.useRef<{ mode: "node" | "pan"; id?: string; startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  const mutate = React.useCallback((fn: (b: BoardData) => BoardData) => {
    setBoard((b) => fn(b)); setDirty(true);
  }, []);

  /* The app-wide page zoom breaks pointer math on a custom canvas.
     This page opts out; the canvas has its own zoom. */
  React.useEffect(() => {
    document.documentElement.classList.add("machine-zoom-off");
    return () => document.documentElement.classList.remove("machine-zoom-off");
  }, []);

  /* ---------- data ---------- */
  const loadPositions = React.useCallback(async () => {
    const r = await fetch("/api/machine/positions", { cache: "no-store" });
    if (r.ok) setPositions((await r.json()).positions);
  }, []);
  const load = React.useCallback(async () => {
    const r = await fetch("/api/machine", { cache: "no-store" });
    if (!r.ok) return;
    const { board: row } = await r.json();
    setBoard(row.data); setMeta({ updatedAt: row.updatedAt, updatedBy: row.updatedBy });
    setDirty(false); setBanner(null);
  }, []);
  React.useEffect(() => { load(); loadPositions(); }, [load, loadPositions]);
  React.useEffect(() => {
    const id = setInterval(async () => {
      loadPositions();
      const r = await fetch("/api/machine", { cache: "no-store" });
      if (!r.ok) return;
      const { board: row } = await r.json();
      const cur = metaRef.current;
      if (cur && row.updatedAt !== cur.updatedAt) {
        if (!dirtyRef.current) {
          setBoard(row.data); setMeta({ updatedAt: row.updatedAt, updatedBy: row.updatedBy });
        } else setBanner({ kind: "stale", by: row.updatedBy });
      }
    }, 20000);
    return () => clearInterval(id);
  }, [loadPositions]);

  async function save(force = false) {
    setSaveState("saving");
    const r = await fetch("/api/machine", {
      method: "PUT", headers: authedHeaders(),
      body: JSON.stringify({ data: board, expectedUpdatedAt: meta?.updatedAt, force }),
    });
    if (r.status === 409) {
      const j = await r.json();
      setBanner({ kind: "conflict", by: j.updatedBy });
      setSaveState("idle");
      return;
    }
    if (r.ok) {
      const { board: row } = await r.json();
      setMeta({ updatedAt: row.updatedAt, updatedBy: row.updatedBy });
      setDirty(false); setBanner(null); setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1600);
    } else setSaveState("idle");
  }

  /* ---------- geometry ---------- */
  function world(e: { clientX: number; clientY: number }) {
    const r = viewportRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left - pan.x) / scale, y: (e.clientY - r.top - pan.y) / scale };
  }

  /* wheel zoom toward the cursor; native listener so preventDefault works */
  React.useEffect(() => {
    const vp = viewportRef.current; if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const prev = scaleRef.current;
      const next = Math.min(1.7, Math.max(0.3, prev * (e.deltaY > 0 ? 0.9 : 1.1)));
      const p = panRef.current;
      setPan({ x: mx - ((mx - p.x) / prev) * next, y: my - ((my - p.y) / prev) * next });
      setScale(next);
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, []);

  /* ---------- pointer interactions ---------- */
  function onCanvasPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    if (placing) {
      const w = world(e); const s = NODE_SIZE[placing.type];
      const node: MachineNode = {
        id: uid(), type: placing.type,
        x: Math.round(w.x - s.w / 2), y: Math.round(w.y - s.h / 2),
        label: placing.type === "endpoint"
          ? ENDPOINT_KINDS[placing.endpointKind as keyof typeof ENDPOINT_KINDS]
          : placing.type === "task" ? "New task"
          : placing.type === "engine" ? "New engine" : "Note",
        ...(placing.type === "task" ? { state: "todo" } : {}),
        ...(placing.endpointKind ? { endpointKind: placing.endpointKind } : {}),
      };
      mutate((b) => ({ ...b, nodes: [...b.nodes, node] }));
      setSelected(node.id); setPlacing(null); setGhost(null);
      return;
    }
    drag.current = { mode: "pan", startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y, moved: false };
  }
  function onNodePointerDown(e: React.PointerEvent, node: MachineNode) {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (placing) return;
    if (linking) {
      if (linking !== node.id && !board.edges.some((x) => x.from === linking && x.to === node.id)) {
        mutate((b) => ({ ...b, edges: [...b.edges, { id: uid(), from: linking, to: node.id }] }));
      }
      setLinking(null);
      return;
    }
    setSelected(node.id); setSelectedEdge(null);
    drag.current = { mode: "node", id: node.id, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (placing) setGhost(world(e));
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (d.mode === "pan") setPan({ x: d.origX + dx, y: d.origY + dy });
    else if (d.id) {
      const nx = Math.round(d.origX + dx / scale), ny = Math.round(d.origY + dy / scale);
      setBoard((b) => ({ ...b, nodes: b.nodes.map((n) => (n.id === d.id ? { ...n, x: nx, y: ny } : n)) }));
    }
  }
  function onPointerUp() {
    const d = drag.current;
    if (d?.mode === "node" && d.moved) setDirty(true);
    if (d?.mode === "node" && !d.moved && d.id) {
      // a clean click on a human opens their character sheet
      const n = nodeMap.get(d.id);
      if (n?.type === "person") { setSheetId(d.id); setSelected(null); }
    }
    if (d?.mode === "pan" && !d.moved) { setSelected(null); setSelectedEdge(null); setLinking(null); setPortalPicker(false); setSheetId(null); }
    drag.current = null;
  }
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape") { setPlacing(null); setGhost(null); setLinking(null); setPortalPicker(false); setSpawnOpen(false); setSheetId(null); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selected) {
          mutate((b) => ({
            nodes: b.nodes.filter((n) => n.id !== selected),
            edges: b.edges.filter((x) => x.from !== selected && x.to !== selected),
          }));
          setSelected(null);
        } else if (selectedEdge) {
          mutate((b) => ({ ...b, edges: b.edges.filter((x) => x.id !== selectedEdge) }));
          setSelectedEdge(null);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, selectedEdge, mutate]);

  function fit() {
    const vp = viewportRef.current; if (!vp || board.nodes.length === 0) return;
    const xs = board.nodes.map((n) => n.x), ys = board.nodes.map((n) => n.y);
    const xe = board.nodes.map((n) => n.x + NODE_SIZE[n.type].w), ye = board.nodes.map((n) => n.y + NODE_SIZE[n.type].h);
    const bx = Math.min(...xs) - 60, by = Math.min(...ys) - 60;
    const bw = Math.max(...xe) - bx + 60, bh = Math.max(...ye) - by + 60;
    const r = vp.getBoundingClientRect();
    const s = Math.min(r.width / bw, r.height / bh, 1.1);
    setScale(s);
    setPan({ x: (r.width - bw * s) / 2 - bx * s, y: (r.height - bh * s) / 2 - by * s });
  }
  const fitted = React.useRef(false);
  React.useEffect(() => {
    if (!fitted.current && board.nodes.length) { fitted.current = true; setTimeout(fit, 60); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.nodes.length]);

  const nodeMap = React.useMemo(() => new Map(board.nodes.map((n) => [n.id, n])), [board.nodes]);
  const posById = React.useMemo(() => new Map(positions.map((p) => [p.id, p])), [positions]);
  function edgePath(fromId: string, toId: string): string | null {
    const a = nodeMap.get(fromId), b = nodeMap.get(toId);
    if (!a || !b) return null;
    const sa = NODE_SIZE[a.type], sb = NODE_SIZE[b.type];
    const rightward = b.x + sb.w / 2 >= a.x + sa.w / 2;
    const x1 = rightward ? a.x + sa.w : a.x, y1 = a.y + sa.h / 2;
    const x2 = rightward ? b.x : b.x + sb.w, y2 = b.y + sb.h / 2;
    const k = Math.max(40, Math.abs(x2 - x1) / 2);
    return `M ${x1} ${y1} C ${rightward ? x1 + k : x1 - k} ${y1}, ${rightward ? x2 - k : x2 + k} ${y2}, ${x2} ${y2}`;
  }

  /* ---------- spawn deploy ---------- */
  function nextLaneY(type: NodeType, defaultY: number): number {
    const ys = board.nodes.filter((n) => n.type === type).map((n) => n.y + NODE_SIZE[n.type].h);
    return ys.length ? Math.max(...ys) + 60 : defaultY;
  }
  async function deployHuman(input: {
    mode: "existing" | "new"; positionId?: string; title: string;
    engineIds: string[]; newEngines: string[]; tasks: string[];
  }) {
    let pos: { id: string; title: string } | null = null;
    if (input.mode === "new") {
      const r = await fetch("/api/machine/spawn", {
        method: "POST", headers: authedHeaders(),
        body: JSON.stringify({ title: input.title, tasks: input.tasks }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Could not create the role");
      pos = (await r.json()).position;
    } else if (input.positionId) {
      const p = posById.get(input.positionId);
      pos = p ? { id: p.id, title: p.title } : null;
      if (pos && input.tasks.length) {
        await fetch("/api/machine/reflect", {
          method: "POST", headers: authedHeaders(),
          body: JSON.stringify({ positionId: pos.id, addTasks: input.tasks }),
        });
      }
    }

    const personId = uid();
    const personY = nextLaneY("person", 120);
    const newNodes: MachineNode[] = [{
      id: personId, type: "person", x: 80, y: personY,
      label: pos?.title ?? input.title, state: "needed",
      ...(pos ? { positionId: pos.id } : {}),
    }];
    const engineIds = [...input.engineIds];
    input.newEngines.forEach((name, i) => {
      const id = uid();
      engineIds.push(id);
      newNodes.push({ id, type: "engine", x: 560, y: nextLaneY("engine", 140) + i * 200, label: name });
    });
    const firstEngine = engineIds[0];
    input.tasks.forEach((label, i) => {
      const id = uid();
      newNodes.push({ id, type: "task", x: 340, y: personY - 20 + i * 120, label, state: "todo" });
    });
    const newEdges = [
      ...engineIds.map((eid) => ({ id: uid(), from: personId, to: eid })),
      ...newNodes.filter((n) => n.type === "task").map((t) => ({
        id: uid(), from: firstEngine ? t.id : personId, to: firstEngine ? firstEngine : t.id,
      })),
    ];
    mutate((b) => ({ nodes: [...b.nodes, ...newNodes], edges: [...b.edges, ...newEdges] }));
    setSelected(personId);
    loadPositions();
  }

  async function toggleHired(node: MachineNode) {
    const nextState = node.state === "hired" ? "needed" : "hired";
    mutate((b) => ({ ...b, nodes: b.nodes.map((n) => (n.id === node.id ? { ...n, state: nextState } : n)) }));
    if (node.positionId) {
      await fetch("/api/machine/reflect", {
        method: "POST", headers: authedHeaders(),
        body: JSON.stringify({ positionId: node.positionId, action: nextState === "hired" ? "hired" : "needed" }),
      });
      loadPositions();
    }
  }

  const sel = selected ? nodeMap.get(selected) : null;
  const sheetNode = sheetId ? nodeMap.get(sheetId) : null;
  const counts = {
    people: board.nodes.filter((n) => n.type === "person").length,
    toHire: board.nodes.filter((n) => n.type === "person" && n.state !== "hired").length,
    engines: board.nodes.filter((n) => n.type === "engine").length,
    tasks: board.nodes.filter((n) => n.type === "task").length,
  };
  const linkedIds = new Set(board.nodes.filter((n) => n.positionId).map((n) => n.positionId));
  const openRoles = positions.filter((p) => !linkedIds.has(p.id) && p.status !== "archived");

  /* ---------- render ---------- */
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="flex items-center gap-3">
          <a href="/" title="Back to OS"
            className="flex items-center gap-2 rounded-full border border-line2 bg-white/[0.03] px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-cream-base transition-colors hover:bg-white/[0.08]">
            <ChevronLeft className="h-4 w-4" /> OS
          </a>
          <Image src="/logo.png" alt="All Volleyball" width={36} height={36} className="rounded-lg" />
          <div>
            <Eyebrow>/ BUILD MODE</Eyebrow>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-cream-light">The Machine</h1>
          </div>
          {meta ? (
            <span className="ml-2 hidden font-mono text-[10px] uppercase tracking-wider text-dim lg:inline">
              Saved {timeAgo(meta.updatedAt)} by {meta.updatedBy}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setLegend((v) => !v)}><HelpCircle className="h-4 w-4" /> Legend</Button>
          <Identity />
          <ThemeToggle />
          <Button size="sm" onClick={() => save(false)} disabled={saveState === "saving"}>
            <Save className="h-4 w-4" />
            {saveState === "saving" ? "Saving." : saveState === "saved" ? "Saved" : dirty ? "Save changes" : "Save"}
            {dirty ? <span className="ml-1 h-2 w-2 rounded-full bg-white" /> : null}
          </Button>
        </div>
      </header>

      {banner ? (
        <div className="flex items-center justify-between gap-3 border-b border-red/40 bg-red/10 px-5 py-2 text-sm text-red">
          <span>
            {banner.kind === "conflict" ? `${banner.by} saved while you were editing.` : `${banner.by} saved a newer version.`}
            {" "}Loading it will replace your unsaved changes.
          </span>
          <span className="flex gap-2">
            <Button size="sm" variant="danger" onClick={() => load()}>Load latest</Button>
            <Button size="sm" variant="subtle" onClick={() => save(true)}>Save mine anyway</Button>
          </span>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        className={cn(
          "relative flex-1 touch-none select-none overflow-hidden",
          placing ? "cursor-crosshair" : linking ? "cursor-alias" : "cursor-grab active:cursor-grabbing"
        )}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* HUD */}
        <div className="pointer-events-none absolute left-4 top-3 z-30 flex gap-3 font-mono text-[10px] uppercase tracking-wider text-dim">
          <span>{counts.people} humans ({counts.toHire} to hire)</span>
          <span>{counts.engines} engines</span>
          <span>{counts.tasks} tasks</span>
        </div>
        <div className="absolute right-4 top-3 z-30 flex gap-1">
          <Button size="icon" variant="subtle" onClick={() => setScale((s) => Math.min(1.7, s * 1.15))}><ZoomIn className="h-4 w-4" /></Button>
          <Button size="icon" variant="subtle" onClick={() => setScale((s) => Math.max(0.3, s / 1.15))}><ZoomOut className="h-4 w-4" /></Button>
          <Button size="icon" variant="subtle" onClick={fit}><Maximize2 className="h-4 w-4" /></Button>
        </div>
        {linking ? (
          <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-red/50 bg-red/15 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-red">
            Click a target to link. Esc cancels.
          </div>
        ) : placing ? (
          <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-line2 bg-ink-panel px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-cream-base">
            Click the field to place. Esc cancels.
          </div>
        ) : null}

        {/* world */}
        <div className="absolute left-0 top-0"
          style={{
            width: WORLD.w, height: WORLD.h,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0",
            backgroundImage: "radial-gradient(rgba(128,128,128,.16) 1.5px, transparent 1.5px)",
            backgroundSize: "44px 44px",
          }}>
          <svg width={WORLD.w} height={WORLD.h} className="absolute left-0 top-0">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#D7172A" opacity="0.8" />
              </marker>
            </defs>
            {board.edges.map((ed) => {
              const d = edgePath(ed.from, ed.to);
              if (!d) return null;
              const isSel = selectedEdge === ed.id;
              return (
                <g key={ed.id}>
                  <path d={d} fill="none" stroke="transparent" strokeWidth={16} style={{ pointerEvents: "stroke", cursor: "pointer" }}
                    onPointerDown={(e) => { e.stopPropagation(); setSelectedEdge(ed.id); setSelected(null); }} />
                  <path d={d} fill="none" stroke={isSel ? "#D7172A" : "rgba(215,23,42,.45)"}
                    strokeWidth={isSel ? 3.5 : 2.2} markerEnd="url(#arrow)" style={{ pointerEvents: "none" }} />
                </g>
              );
            })}
          </svg>

          {board.nodes.map((node, idx) => {
            const s = NODE_SIZE[node.type];
            const isSel = selected === node.id;
            const isLinkSrc = linking === node.id;
            const Icon = node.type === "endpoint" ? ENDPOINT_ICON[node.endpointKind ?? "purchase"] ?? ShoppingCart : null;
            const pos = node.positionId ? posById.get(node.positionId) : null;
            return (
              <motion.div key={node.id}
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className={cn("absolute flex flex-col items-center justify-center rounded-xl text-center",
                  isSel && "z-20", linking && !isLinkSrc && "cursor-alias")}
                style={{ left: node.x, top: node.y, width: s.w, height: s.h }}
                onPointerDown={(e) => onNodePointerDown(e, node)}>
                {isSel || isLinkSrc ? (
                  <span className="machine-pulse pointer-events-none absolute inset-[-6px] rounded-2xl border-2 border-red" />
                ) : null}
                {node.type === "person" ? (
                  <>
                    <PersonSprite hired={node.state === "hired"} bob={(idx % 2) + 1} />
                    <span className="mt-0.5 max-w-full truncate px-1 text-[12px] font-bold leading-tight text-cream-light">{node.label}</span>
                    {node.sub ? <span className="max-w-full truncate px-1 font-mono text-[9px] uppercase tracking-wider text-dim">{node.sub}</span> : null}
                    {node.state === "hired" ? (
                      <span className="font-mono text-[8px] uppercase tracking-wider text-[#57c47b]">On the team</span>
                    ) : pos ? (
                      <span className={cn("font-mono text-[8px] uppercase tracking-wider", pos.status === "filled" ? "text-[#57c47b]" : "text-red")}>
                        {pos.status === "filled" ? "Role filled" : `${pos.applicantCount} applicant${pos.applicantCount === 1 ? "" : "s"}`}
                      </span>
                    ) : (
                      <span className="font-mono text-[8px] uppercase tracking-wider text-red">To hire</span>
                    )}
                  </>
                ) : node.type === "task" ? (
                  <>
                    <RockSprite done={node.state === "done"} />
                    <span className="max-w-full truncate px-1 text-[11px] font-semibold leading-tight text-cream-light">{node.label}</span>
                  </>
                ) : node.type === "engine" ? (
                  <>
                    <EngineSprite />
                    <span className="max-w-full truncate px-1 text-[12px] font-bold leading-tight text-cream-light">{node.label}</span>
                    {node.sub ? <span className="max-w-full truncate px-1 font-mono text-[9px] uppercase tracking-wider text-dim">{node.sub}</span> : null}
                  </>
                ) : node.type === "endpoint" ? (
                  <>
                    <span className="relative grid h-14 w-14 place-items-center">
                      <span className="machine-portal absolute inset-0 rounded-full border-2 border-red" />
                      <span className="absolute inset-[7px] rounded-full border border-red/50 bg-red/10" />
                      {Icon ? <Icon className="relative h-5 w-5 text-red" /> : null}
                    </span>
                    <span className="mt-1.5 max-w-full px-1 text-[11px] font-bold leading-tight text-cream-light">{node.label}</span>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-red">Endpoint</span>
                  </>
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-lg border border-[#e3ad36]/50 bg-[#e3ad36]/10 p-2 text-[11px] leading-snug text-cream-base">
                    {node.label}
                  </span>
                )}
              </motion.div>
            );
          })}

          {placing && ghost ? (
            <div className="pointer-events-none absolute rounded-xl border-2 border-dashed border-red/60 bg-red/5"
              style={{
                left: ghost.x - NODE_SIZE[placing.type].w / 2, top: ghost.y - NODE_SIZE[placing.type].h / 2,
                width: NODE_SIZE[placing.type].w, height: NODE_SIZE[placing.type].h,
              }} />
          ) : null}
        </div>

        {/* selected toolbar */}
        {sel ? (
          <div className="absolute bottom-28 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-line2 bg-ink-raised px-3 py-2 shadow-2xl">
            <input
              value={sel.label}
              onChange={(e) => mutate((b) => ({ ...b, nodes: b.nodes.map((n) => (n.id === sel.id ? { ...n, label: e.target.value } : n)) }))}
              className="h-9 w-44 rounded-md border border-line2 bg-ink-deep px-2.5 text-sm text-cream-light focus:border-red focus:outline-none"
            />
            {sel.type === "person" || sel.type === "engine" ? (
              <input
                value={sel.sub ?? ""} placeholder="Subtitle"
                onChange={(e) => mutate((b) => ({ ...b, nodes: b.nodes.map((n) => (n.id === sel.id ? { ...n, sub: e.target.value } : n)) }))}
                className="h-9 w-32 rounded-md border border-line2 bg-ink-deep px-2.5 text-xs text-cream-base focus:border-red focus:outline-none"
              />
            ) : null}
            {sel.type === "person" ? (
              <Button size="sm" variant="subtle" onClick={() => toggleHired(sel)}>
                {sel.state === "hired" ? "Mark to hire" : "Mark hired"}
              </Button>
            ) : null}
            {sel.type === "task" ? (
              <Button size="sm" variant="subtle"
                onClick={() => mutate((b) => ({ ...b, nodes: b.nodes.map((n) => (n.id === sel.id ? { ...n, state: n.state === "done" ? "todo" : "done" } : n)) }))}>
                {sel.state === "done" ? "Reopen" : "Mark done"}
              </Button>
            ) : null}
            <Button size="sm" variant={linking === sel.id ? "primary" : "subtle"} onClick={() => setLinking(linking === sel.id ? null : sel.id)}>
              <Link2 className="h-4 w-4" /> Link
            </Button>
            <Button size="sm" variant="danger" onClick={() => {
              mutate((b) => ({
                nodes: b.nodes.filter((n) => n.id !== sel.id),
                edges: b.edges.filter((x) => x.from !== sel.id && x.to !== sel.id),
              }));
              setSelected(null);
            }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ) : selectedEdge ? (
          <div className="absolute bottom-28 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-line2 bg-ink-raised px-3 py-2 shadow-2xl">
            <span className="font-mono text-[11px] uppercase tracking-wider text-dim">Connection selected</span>
            <Button size="sm" variant="danger" onClick={() => {
              mutate((b) => ({ ...b, edges: b.edges.filter((x) => x.id !== selectedEdge) }));
              setSelectedEdge(null);
            }}><Trash2 className="h-4 w-4" /> Remove</Button>
          </div>
        ) : null}

        {/* palette: humans first */}
        <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-end gap-1.5 rounded-2xl border border-line2 bg-ink-raised/95 px-3 py-2 shadow-2xl">
          <button onClick={() => { setPortalPicker(false); setPlacing(null); setSpawnOpen(true); }}
            className="relative flex w-24 flex-col items-center gap-0.5 rounded-xl border border-red/60 bg-red/10 px-2 py-2 transition-transform hover:-translate-y-0.5">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-red px-2 py-px font-mono text-[8px] uppercase tracking-wider text-white">Start here</span>
            <span className="flex h-12 items-center text-cream-light"><PersonSprite hired={false} /></span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-red">Spawn human</span>
          </button>
          {([
            ["task", "Task", <RockSprite key="t" done={false} />],
            ["engine", "Engine", <EngineSprite key="e" />],
          ] as [NodeType, string, React.ReactNode][]).map(([type, label, sprite]) => (
            <button key={type}
              onClick={() => { setPortalPicker(false); setPlacing({ type }); setSelected(null); }}
              className={cn("flex w-20 flex-col items-center gap-0.5 rounded-xl border px-2 py-1.5 transition-colors",
                placing?.type === type ? "border-red bg-red/10" : "border-transparent hover:border-line2 hover:bg-white/[0.04]")}>
              <span className="flex h-12 items-center text-cream-light">{sprite}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-dim">{label}</span>
            </button>
          ))}
          <div className="relative">
            <button onClick={() => setPortalPicker((v) => !v)}
              className={cn("flex w-20 flex-col items-center gap-0.5 rounded-xl border px-2 py-1.5 transition-colors",
                placing?.type === "endpoint" || portalPicker ? "border-red bg-red/10" : "border-transparent hover:border-line2 hover:bg-white/[0.04]")}>
              <span className="relative mt-1 grid h-10 w-10 place-items-center">
                <span className="machine-portal absolute inset-0 rounded-full border-2 border-red" />
                <ShoppingCart className="h-4 w-4 text-red" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-dim">Endpoint</span>
            </button>
            {portalPicker ? (
              <div className="absolute bottom-full left-1/2 mb-2 w-56 -translate-x-1/2 rounded-xl border border-line2 bg-ink-raised p-1.5 shadow-2xl">
                {Object.entries(ENDPOINT_KINDS).map(([k, label]) => {
                  const Icon = ENDPOINT_ICON[k];
                  return (
                    <button key={k}
                      onClick={() => { setPlacing({ type: "endpoint", endpointKind: k }); setPortalPicker(false); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-cream-base hover:bg-white/[0.06]">
                      <Icon className="h-4 w-4 text-red" /> {label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <button onClick={() => { setPortalPicker(false); setPlacing({ type: "note" }); }}
            className={cn("flex w-20 flex-col items-center gap-0.5 rounded-xl border px-2 py-1.5 transition-colors",
              placing?.type === "note" ? "border-red bg-red/10" : "border-transparent hover:border-line2 hover:bg-white/[0.04]")}>
            <span className="mt-1 grid h-10 w-12 place-items-center rounded border border-[#e3ad36]/60 bg-[#e3ad36]/15 text-[10px] text-cream-base">Aa</span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-dim">Note</span>
          </button>
        </div>

        {legend ? (
          <div className="absolute left-4 top-12 z-40 w-80 rounded-xl border border-line2 bg-ink-raised p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Eyebrow>/ HOW TO READ THIS</Eyebrow>
              <button onClick={() => setLegend(false)} className="text-dim hover:text-cream-light"><X className="h-4 w-4" /></button>
            </div>
            <ul className="mt-3 space-y-2.5 text-sm text-cream-base/90">
              <li className="flex gap-2.5"><span className="shrink-0 text-cream-light"><PersonSprite hired={false} /></span>
                A human who runs part of the machine. Spawning one opens the role in The Rebuild and shows live applicant counts here. Click any human to open their character sheet.</li>
              <li className="flex items-center gap-2.5"><span className="shrink-0 text-cream-light"><EngineSprite /></span>
                An engine: a marketing effort that runs on a cadence.</li>
              <li className="flex items-center gap-2.5"><span className="shrink-0 text-cream-light"><RockSprite done={false} /></span>
                A task that must be built for an engine to work. Spawned tasks land on the role too.</li>
              <li className="flex items-center gap-2.5">
                <span className="relative grid h-10 w-10 shrink-0 place-items-center">
                  <span className="machine-portal absolute inset-0 rounded-full border-2 border-red" />
                  <ShoppingCart className="h-4 w-4 text-red" />
                </span>
                An endpoint: one of the five ways a customer reaches us.</li>
            </ul>
            <p className="mt-3 border-t border-line pt-3 text-xs text-dim">
              Everything starts from a human. People power engines, engines push customers to the five endpoints.
              Press Save to publish the layout for the team.
            </p>
          </div>
        ) : null}

        {spawnOpen ? (
          <SpawnModal
            openRoles={openRoles}
            engines={board.nodes.filter((n) => n.type === "engine")}
            onClose={() => setSpawnOpen(false)}
            onDeploy={async (input) => { await deployHuman(input); setSpawnOpen(false); }}
          />
        ) : null}

        {sheetNode ? (
          <CharacterSheet
            node={sheetNode}
            pos={sheetNode.positionId ? posById.get(sheetNode.positionId) ?? null : null}
            engines={board.edges
              .filter((x) => x.from === sheetNode.id)
              .map((x) => nodeMap.get(x.to))
              .filter((n): n is MachineNode => !!n && n.type === "engine")}
            onRename={(label) => mutate((b) => ({ ...b, nodes: b.nodes.map((n) => (n.id === sheetNode.id ? { ...n, label } : n)) }))}
            onSub={(sub) => mutate((b) => ({ ...b, nodes: b.nodes.map((n) => (n.id === sheetNode.id ? { ...n, sub } : n)) }))}
            onToggleHired={() => toggleHired(sheetNode)}
            onLink={() => { setLinking(sheetNode.id); setSheetId(null); }}
            onDelete={() => {
              mutate((b) => ({
                nodes: b.nodes.filter((n) => n.id !== sheetNode.id),
                edges: b.edges.filter((x) => x.from !== sheetNode.id && x.to !== sheetNode.id),
              }));
              setSheetId(null);
            }}
            onClose={() => setSheetId(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ---------- character sheet: click a human, see the hire ---------- */
function CharacterSheet({
  node, pos, engines, onRename, onSub, onToggleHired, onLink, onDelete, onClose,
}: {
  node: MachineNode;
  pos: PositionLite | null;
  engines: MachineNode[];
  onRename: (label: string) => void;
  onSub: (sub: string) => void;
  onToggleHired: () => void;
  onLink: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const hired = node.state === "hired";
  const tasks = pos?.tasksNow ?? [];
  return (
    <div
      className="absolute right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-line2 bg-ink-raised/95 shadow-[-30px_0_80px_rgba(0,0,0,.5)] backdrop-blur"
      style={{ animation: "fade-in .25s cubic-bezier(.2,.7,.2,1)" }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between border-b border-line px-6 py-5">
        <div className="flex items-center gap-4">
          <span className={cn("grid h-20 w-16 place-items-center rounded-2xl border",
            hired ? "border-[#57c47b]/40 bg-[#57c47b]/10" : "border-red/40 bg-red/10")}>
            <span className="text-cream-light"><PersonSprite hired={hired} /></span>
          </span>
          <div>
            <Eyebrow>/ {hired ? "ON THE TEAM" : "BUILDING THIS HIRE"}</Eyebrow>
            <input
              value={node.label}
              onChange={(e) => onRename(e.target.value)}
              className="mt-1 w-full bg-transparent text-xl font-bold tracking-tight text-cream-light focus:outline-none"
            />
            <input
              value={node.sub ?? ""}
              placeholder="Role subtitle"
              onChange={(e) => onSub(e.target.value)}
              className="w-full bg-transparent font-mono text-[11px] uppercase tracking-wider text-dim focus:outline-none"
            />
          </div>
        </div>
        <button onClick={onClose} className="text-dim hover:text-cream-light"><X className="h-5 w-5" /></button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {/* live role stats */}
        {pos ? (
          <div>
            <Eyebrow>/ THE REBUILD STATUS</Eyebrow>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line bg-ink-panel p-3">
                <p className="text-2xl font-bold tabular-nums text-cream-light">{pos.applicantCount}</p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-dim">Applicants</p>
              </div>
              <div className="rounded-xl border border-line bg-ink-panel p-3">
                <p className={cn("text-2xl font-bold capitalize",
                  pos.status === "filled" ? "text-[#57c47b]" : pos.status === "active" ? "text-red" : "text-cream-light")}>
                  {pos.status}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-dim">Role status</p>
              </div>
            </div>
            {pos.mandate ? (
              <p className="mt-3 rounded-xl border border-line bg-ink-panel p-3 text-sm leading-relaxed text-cream-base/90">
                {pos.mandate}
              </p>
            ) : null}
            <a href={`/rebuild/positions/${pos.id}`}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-red/50 bg-red/10 px-4 py-2.5 text-sm font-semibold text-red transition-colors hover:bg-red/20">
              <ExternalLink className="h-4 w-4" /> Open in The Rebuild
            </a>
          </div>
        ) : (
          <p className="rounded-xl border border-line bg-ink-panel p-3 text-sm text-dim">
            {hired
              ? "Core team. Not a role being recruited; this person runs part of the machine today."
              : "Not linked to a role in The Rebuild yet. Spawn humans from the palette to create linked roles."}
          </p>
        )}

        {/* what they run */}
        <div>
          <Eyebrow>/ ENGINES THEY POWER</Eyebrow>
          {engines.length ? (
            <ul className="mt-2 space-y-1.5">
              {engines.map((en) => (
                <li key={en.id} className="flex items-center gap-3 rounded-xl border border-line bg-ink-panel px-3 py-2">
                  <span className="shrink-0 scale-75 text-cream-light"><EngineSprite /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-cream-light">{en.label}</span>
                    {en.sub ? <span className="block truncate font-mono text-[9px] uppercase tracking-wider text-dim">{en.sub}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-dim">Nothing wired yet. Use Link to connect them to an engine.</p>
          )}
        </div>

        {/* their tasks from the rebuild room */}
        {tasks.length ? (
          <div>
            <Eyebrow>/ TASKS ON THEIR PLATE</Eyebrow>
            <ul className="mt-2 space-y-1.5">
              {tasks.map((t, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl border border-line bg-ink-panel px-3 py-2 text-sm text-cream-base/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red" /> {t}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 border-t border-line px-6 py-4">
        <Button size="sm" variant={hired ? "subtle" : "primary"} onClick={onToggleHired}>
          {hired ? "Mark to hire" : "Mark hired"}
        </Button>
        <Button size="sm" variant="subtle" onClick={onLink}><Link2 className="h-4 w-4" /> Link</Button>
        <span className="flex-1" />
        <Button size="sm" variant="danger" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/* ---------- the human spawner ---------- */
function SpawnModal({
  openRoles, engines, onClose, onDeploy,
}: {
  openRoles: PositionLite[];
  engines: MachineNode[];
  onClose: () => void;
  onDeploy: (input: { mode: "existing" | "new"; positionId?: string; title: string; engineIds: string[]; newEngines: string[]; tasks: string[] }) => Promise<void>;
}) {
  const [mode, setMode] = React.useState<"existing" | "new">(openRoles.length ? "existing" : "new");
  const [positionId, setPositionId] = React.useState(openRoles[0]?.id ?? "");
  const [title, setTitle] = React.useState("");
  const [engineIds, setEngineIds] = React.useState<string[]>([]);
  const [newEngines, setNewEngines] = React.useState<string[]>([]);
  const [engineDraft, setEngineDraft] = React.useState("");
  const [tasks, setTasks] = React.useState<string[]>([""]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function deploy() {
    setErr(null);
    const t = mode === "new" ? title.trim() : (openRoles.find((p) => p.id === positionId)?.title ?? "");
    if (!t) { setErr("Name the role first."); return; }
    setBusy(true);
    try {
      await onDeploy({
        mode, positionId: mode === "existing" ? positionId : undefined, title: t,
        engineIds, newEngines, tasks: tasks.map((x) => x.trim()).filter(Boolean),
      });
    } catch (e: any) {
      setErr(e.message ?? "Could not deploy"); setBusy(false);
    }
  }

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/55 p-4" onPointerDown={(e) => e.stopPropagation()}>
      <div className="w-full max-w-xl rounded-2xl border border-line2 bg-ink-raised p-6 shadow-[0_40px_120px_rgba(0,0,0,.6)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red text-white"><UserPlus className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-cream-light">Spawn a human</h2>
              <p className="text-xs text-dim">Everything starts from a person. Deploy the role, then wire what they run.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-dim hover:text-cream-light"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 max-h-[56vh] space-y-4 overflow-y-auto pr-1">
          {/* role */}
          <div>
            <Eyebrow>/ 1. THE ROLE</Eyebrow>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setMode("existing")} disabled={!openRoles.length}
                className={cn("rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider disabled:opacity-40",
                  mode === "existing" ? "border-red bg-red text-white" : "border-line2 text-cream-base")}>
                Open role
              </button>
              <button onClick={() => setMode("new")}
                className={cn("rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider",
                  mode === "new" ? "border-red bg-red text-white" : "border-line2 text-cream-base")}>
                New role
              </button>
            </div>
            <div className="mt-3">
              {mode === "existing" ? (
                <Select value={positionId} onValueChange={setPositionId}>
                  <SelectTrigger><SelectValue placeholder="Pick a role" /></SelectTrigger>
                  <SelectContent>
                    {openRoles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title} ({p.applicantCount} applicants)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Role title, e.g. Email Marketing Specialist" autoFocus />
                  <p className="mt-1.5 text-xs text-dim">Deploy creates this role in The Rebuild right away.</p>
                </div>
              )}
            </div>
          </div>

          {/* engines */}
          <div>
            <Eyebrow>/ 2. ENGINES THEY POWER</Eyebrow>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {engines.map((en) => (
                <button key={en.id}
                  onClick={() => setEngineIds((x) => x.includes(en.id) ? x.filter((i) => i !== en.id) : [...x, en.id])}
                  className={cn("rounded-full border px-3 py-1 text-xs",
                    engineIds.includes(en.id) ? "border-red bg-red/15 text-red" : "border-line2 text-cream-base hover:bg-white/[0.05]")}>
                  {en.label}
                </button>
              ))}
              {newEngines.map((nm, i) => (
                <button key={"new" + i} onClick={() => setNewEngines((x) => x.filter((_, j) => j !== i))}
                  className="rounded-full border border-red bg-red/15 px-3 py-1 text-xs text-red">
                  {nm} (new) ×
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input value={engineDraft} onChange={(e) => setEngineDraft(e.target.value)} placeholder="New engine name"
                onKeyDown={(e) => { if (e.key === "Enter" && engineDraft.trim()) { setNewEngines((x) => [...x, engineDraft.trim()]); setEngineDraft(""); } }} />
              <Button variant="subtle" size="md" onClick={() => { if (engineDraft.trim()) { setNewEngines((x) => [...x, engineDraft.trim()]); setEngineDraft(""); } }}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          {/* tasks */}
          <div>
            <Eyebrow>/ 3. TASKS THEY WILL RUN</Eyebrow>
            <p className="mt-1 text-xs text-dim">These land on the board as rocks and on the role in The Rebuild.</p>
            <div className="mt-2 space-y-2">
              {tasks.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={t} placeholder="One concrete task"
                    onChange={(e) => setTasks((x) => x.map((v, j) => (j === i ? e.target.value : v)))} />
                  <Button variant="ghost" size="icon" onClick={() => setTasks((x) => x.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="subtle" size="sm" onClick={() => setTasks((x) => [...x, ""])}><Plus className="h-4 w-4" /> Add task</Button>
            </div>
          </div>
        </div>

        {err ? <p className="mt-3 text-sm text-red">{err}</p> : null}
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <p className="text-xs text-dim">The board layout publishes when you press Save.</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button disabled={busy} onClick={deploy}><UserPlus className="h-4 w-4" /> {busy ? "Deploying." : "Deploy human"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
