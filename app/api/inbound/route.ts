import { NextRequest, NextResponse } from "next/server";
import { desc, eq, like } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { inboundEmails, plannedEmails } from "@/lib/schema";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  Inbound test-email capture.

  Point an inbound-parse service (CloudMailin, Postmark, SendGrid Inbound
  Parse, Mailgun Routes) at:

    POST https://<your-domain>/api/inbound?key=<INBOUND_SECRET>

  Then add that service's email address as a recipient of the Redo test send
  (or forward the test email to it). The HTML lands here, gets stored, and is
  auto-matched to a planned email by:
    1. a [pe:xxxxxxxx] token in the subject (first 8 chars of the email id), or
    2. exact subject match against subject A (Fwd:/Re: prefixes stripped).
  Unmatched emails can be linked manually from the dashboard.
*/

function normalizeSubject(s: string): string {
  return s.replace(/^(\s*(fwd?|re)\s*:\s*)+/i, "").trim().toLowerCase();
}

function pick(...vals: (string | undefined | null)[]): string {
  for (const v of vals) if (v && String(v).trim()) return String(v).trim();
  return "";
}

async function parsePayload(req: NextRequest): Promise<{ subject: string; html: string; to: string; from: string }> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    // SendGrid Inbound Parse / Mailgun style
    const f = await req.formData();
    const g = (k: string) => { const v = f.get(k); return typeof v === "string" ? v : ""; };
    return {
      subject: pick(g("subject"), g("Subject")),
      html: pick(g("html"), g("body-html"), g("stripped-html"), g("text"), g("body-plain")),
      to: pick(g("to"), g("recipient"), g("To")),
      from: pick(g("from"), g("sender"), g("From")),
    };
  }
  const j: any = await req.json().catch(() => ({}));
  return {
    // CloudMailin normalized | Postmark | generic
    subject: pick(j?.headers?.subject, j?.Subject, j?.subject),
    html: pick(j?.html, j?.HtmlBody, j?.body_html, j?.["body-html"], j?.TextBody, j?.plain, j?.text),
    to: pick(
      typeof j?.envelope?.to === "string" ? j.envelope.to : undefined,
      Array.isArray(j?.ToFull) ? j.ToFull[0]?.Email : undefined,
      j?.To, j?.to
    ),
    from: pick(j?.envelope?.from, j?.FromFull?.Email, j?.From, j?.from),
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.INBOUND_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "INBOUND_SECRET is not configured on the server." }, { status: 503 });
  }
  if (req.nextUrl.searchParams.get("key") !== secret) {
    return NextResponse.json({ error: "Bad key" }, { status: 401 });
  }
  try {
    const db = getDb();
    const { subject, html, to, from } = await parsePayload(req);
    if (!html) return NextResponse.json({ error: "No HTML body found in payload" }, { status: 400 });

    // Try to match a planned email.
    let matched: string | null = null;
    const token = subject.match(/pe:([a-f0-9]{8})/i)?.[1]?.toLowerCase();
    if (token) {
      const cand = await db.select().from(plannedEmails).where(like(plannedEmails.id, `${token}%`));
      if (cand[0]) matched = cand[0].id;
    }
    if (!matched && subject) {
      const norm = normalizeSubject(subject);
      const all = await db.select().from(plannedEmails).orderBy(desc(plannedEmails.sendDate));
      const hit = all.find((e) => e.subjectA.trim().toLowerCase() === norm);
      if (hit) matched = hit.id;
    }

    const [row] = await db
      .insert(inboundEmails)
      .values({ toAddr: to || null, fromAddr: from || null, subject, html, matchedEmailId: matched })
      .returning({ id: inboundEmails.id });

    if (matched) {
      const [em] = await db
        .update(plannedEmails)
        .set({ html, updatedAt: new Date() })
        .where(eq(plannedEmails.id, matched))
        .returning();
      if (em) {
        await logActivity({
          entityType: "campaigns", entityId: em.sendDate.slice(0, 7), actor: "Inbound",
          action: "updated", summary: `test send captured for "${em.subjectA}"`,
        });
      }
    }
    return NextResponse.json({ ok: true, id: row.id, matchedEmailId: matched });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Recent inbound emails for the manual-link picker (no HTML payload).
export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: inboundEmails.id, subject: inboundEmails.subject, fromAddr: inboundEmails.fromAddr,
        matchedEmailId: inboundEmails.matchedEmailId, createdAt: inboundEmails.createdAt,
      })
      .from(inboundEmails)
      .orderBy(desc(inboundEmails.createdAt))
      .limit(20);
    return NextResponse.json({ inbound: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
