// Shared constants, types, and the event writer for the MMC Rebuild section.
import { getDb } from "./db";
import { rebuildEvents } from "./schema";

export const POSITION_STATUSES = ["draft", "active", "paused", "filled", "archived"] as const;
export const STAGES = ["applied", "interview", "trial_paid", "trial_free", "offer", "hired", "bench", "rejected"] as const;

export const STAGE_LABEL: Record<string, string> = {
  applied: "Applied", interview: "Interview", trial_paid: "Paid trial", trial_free: "Free trial",
  offer: "Offer", hired: "Hired", bench: "Bench", rejected: "Rejected",
};
export const STAGE_COLOR: Record<string, string> = {
  applied: "#9aa1ad", interview: "#e3ad36", trial_paid: "#ff6178", trial_free: "#cdc7ba",
  offer: "#D7172A", hired: "#57c47b", bench: "#8b93a3", rejected: "#6b7280",
};
export const STATUS_COLOR: Record<string, string> = {
  draft: "#9aa1ad", active: "#57c47b", paused: "#e3ad36", filled: "#D7172A", archived: "#6b7280",
};

export type EventType =
  | "created" | "edited" | "activated" | "paused" | "filled" | "post_attached" | "tracker_attached"
  | "csv_imported" | "candidate_added" | "stage_changed" | "hired" | "note";

export async function writeRebuildEvent(input: {
  positionId?: string | null;
  candidateId?: string | null;
  type: EventType;
  payload?: Record<string, unknown>;
  actor: string;
}) {
  try {
    const db = getDb();
    await db.insert(rebuildEvents).values({
      positionId: input.positionId ?? null,
      candidateId: input.candidateId ?? null,
      type: input.type,
      payload: input.payload ?? {},
      actor: input.actor,
    });
  } catch {
    // Event logging is best-effort. Never block the mutation on it.
  }
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "position";
}

// The empty extracted-profile shape. Nulls mean "Not provided."
export const EMPTY_PROFILE = {
  name: null, email: null, location: null, address: null,
  role_applied: null, expected_salary_usd: null,
  portfolio_url: null, olj_profile_url: null,
  years_experience: null, tools: [], ai_tools: [],
  work_history: [], education: null, availability: null,
  answers: [], strengths: [], flags: [], summary: null,
};
export type ExtractedProfile = typeof EMPTY_PROFILE & {
  work_history: { company: string | null; role: string | null; duration: string | null }[];
  answers: { question: string | null; answer: string | null }[];
  tools: string[]; ai_tools: string[]; strengths: string[]; flags: string[];
};
