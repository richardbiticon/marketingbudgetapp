import { NextRequest } from "next/server";
import { getDb } from "./db";
import { activity } from "./schema";

// The current actor comes from the x-actor header the client sends.
// This is the interim identity. Real Google auth (Auth.js) replaces it.
export function actorFrom(req: NextRequest): string {
  const a = req.headers.get("x-actor");
  return a && a.trim() ? a.trim() : "Someone";
}

export async function logActivity(input: {
  entityType: string;
  entityId: string;
  actor: string;
  action: "created" | "updated" | "deleted" | "commented";
  summary: string;
}) {
  try {
    const db = getDb();
    await db.insert(activity).values(input);
  } catch {
    // Activity logging is best-effort. Never block the mutation on it.
  }
}
