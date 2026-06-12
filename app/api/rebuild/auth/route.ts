import { NextRequest, NextResponse } from "next/server";
import { makeToken, REBUILD_COOKIE, REBUILD_COOKIE_MAX_AGE } from "@/lib/rebuild-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Thin shared-password gate for an internal tool, not real security.
// Per-user auth is the upgrade path. Password compared server side only.
export async function POST(req: NextRequest) {
  const expected = process.env.REBUILD_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "REBUILD_PASSWORD is not configured on the server." }, { status: 503 });
  }
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || password !== expected) {
    return NextResponse.json({ error: "Not it." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(REBUILD_COOKIE, await makeToken(), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: REBUILD_COOKIE_MAX_AGE,
  });
  return res;
}
