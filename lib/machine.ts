// The Machine: shared types, the five endpoints, and the seeded template
// board. The board is one JSON document; the canvas edits a local copy and
// the Save button persists it.

export type NodeType = "person" | "task" | "engine" | "endpoint" | "note";

export interface MachineNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
  sub?: string;          // person: role context; engine: short note
  state?: string;        // person: "needed" | "hired"; task: "todo" | "done"
  endpointKind?: string; // one of ENDPOINT_KINDS keys
  positionId?: string;   // person: linked hiring-room position id
  positionRef?: string;  // template only: position slug, resolved to positionId at seed time
}
export interface MachineEdge { id: string; from: string; to: string }
export interface BoardData { nodes: MachineNode[]; edges: MachineEdge[] }

// The only final endpoints we drive people to. Everything flows here.
export const ENDPOINT_KINDS = {
  contact_form: "Contact us form",
  call: "Call",
  purchase: "Purchase on the website",
  email_us: "Email us",
  call_form: "Call us form",
} as const;

export const NODE_SIZE: Record<NodeType, { w: number; h: number }> = {
  person: { w: 120, h: 132 },
  task: { w: 130, h: 96 },
  engine: { w: 168, h: 120 },
  endpoint: { w: 156, h: 116 },
  note: { w: 180, h: 90 },
};

const n = (
  id: string, type: NodeType, x: number, y: number, label: string,
  extra: Partial<MachineNode> = {},
): MachineNode => ({ id, type, x, y, label, ...extra });
const e = (from: string, to: string): MachineEdge => ({ id: `${from}->${to}`, from, to });

// The seeded map: people power engines, engines drive the five endpoints.
// Reads left to right. Fully editable; this is just the starting layout.
export const TEMPLATE_BOARD: BoardData = {
  nodes: [
    // people (left column), linked to the hiring room by slug
    n("p-ops", "person", 80, 120, "Marketing Ops", { sub: "Coordinator", state: "needed", positionRef: "marketing-operations-coordinator" }),
    n("p-social", "person", 80, 300, "Social Specialist", { sub: "Organic social", state: "needed", positionRef: "social-media-specialist" }),
    n("p-sr-design", "person", 80, 480, "Senior Designer", { sub: "Visual standard", state: "needed", positionRef: "senior-graphic-designer" }),
    n("p-jr-design", "person", 80, 660, "Junior Designer", { sub: "Production volume", state: "needed", positionRef: "junior-graphic-designer" }),
    n("p-video", "person", 80, 840, "Video Editor", { sub: "Short form", state: "needed", positionRef: "video-editor" }),
    n("p-richard", "person", 80, 1020, "Richard", { sub: "Runs the system", state: "hired" }),

    // engines (middle)
    n("en-email", "engine", 560, 140, "Email engine", { sub: "Klaviyo and Redo sends" }),
    n("en-social", "engine", 560, 360, "Social engine", { sub: "Feed, stories, UGC" }),
    n("en-paid", "engine", 560, 580, "Paid ads engine", { sub: "Meta and Google" }),
    n("en-site", "engine", 560, 800, "Site and landing engine", { sub: "LPs, PDPs, CustomFuze" }),

    // tasks (rocks near their engines)
    n("t-june", "task", 360, 70, "June email arc", { state: "todo" }),
    n("t-cal", "task", 360, 430, "Content calendar", { state: "todo" }),
    n("t-lp", "task", 360, 740, "Tryout LP", { state: "done" }),
    n("t-look", "task", 360, 900, "Lookbook v2", { state: "todo" }),

    // the five endpoints (right column portals)
    n("ep-contact", "endpoint", 1100, 80, ENDPOINT_KINDS.contact_form, { endpointKind: "contact_form" }),
    n("ep-call", "endpoint", 1100, 280, ENDPOINT_KINDS.call, { endpointKind: "call" }),
    n("ep-purchase", "endpoint", 1100, 480, ENDPOINT_KINDS.purchase, { endpointKind: "purchase" }),
    n("ep-email", "endpoint", 1100, 680, ENDPOINT_KINDS.email_us, { endpointKind: "email_us" }),
    n("ep-callform", "endpoint", 1100, 880, ENDPOINT_KINDS.call_form, { endpointKind: "call_form" }),

    // one orientation note
    n("note-1", "note", 540, 1020, "People power engines. Engines drive the five ways money arrives. Drag, link, and press Save."),
  ],
  edges: [
    // people -> engines
    e("p-ops", "en-email"), e("p-ops", "en-paid"),
    e("p-social", "en-social"),
    e("p-sr-design", "en-site"), e("p-sr-design", "en-email"),
    e("p-jr-design", "en-social"),
    e("p-video", "en-social"), e("p-video", "en-paid"),
    e("p-richard", "en-paid"), e("p-richard", "en-site"),
    // tasks -> engines
    e("t-june", "en-email"), e("t-cal", "en-social"),
    e("t-lp", "en-site"), e("t-look", "en-site"),
    // engines -> endpoints
    e("en-email", "ep-purchase"), e("en-email", "ep-email"),
    e("en-social", "ep-contact"), e("en-social", "ep-purchase"),
    e("en-paid", "ep-purchase"), e("en-paid", "ep-call"),
    e("en-site", "ep-contact"), e("en-site", "ep-purchase"), e("en-site", "ep-callform"),
  ],
};
