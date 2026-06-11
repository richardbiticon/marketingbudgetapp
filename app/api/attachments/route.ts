import { NextRequest, NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { attachments } from "@/lib/schema";
import { attachmentInput } from "@/lib/validation";
import { actorFrom, logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List metadata only (no base64 payload) for an entity.
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sp = req.nextUrl.searchParams;
    const entityType = sp.get("entityType");
    const entityId = sp.get("entityId");
    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
    }
    const rows = await db
      .select({
        id: attachments.id, filename: attachments.filename, mime: attachments.mime,
        sizeBytes: attachments.sizeBytes, uploader: attachments.uploader, createdAt: attachments.createdAt,
      })
      .from(attachments)
      .where(and(eq(attachments.entityType, entityType), eq(attachments.entityId, entityId)))
      .orderBy(desc(attachments.createdAt));
    return NextResponse.json({ attachments: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const parsed = attachmentInput.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const d = parsed.data;
    const sizeBytes = Math.floor(d.dataBase64.length * 0.75);
    const [row] = await db
      .insert(attachments)
      .values({
        entityType: d.entityType, entityId: d.entityId, filename: d.filename,
        mime: d.mime, data: d.dataBase64, sizeBytes, uploader: actor,
      })
      .returning({ id: attachments.id, filename: attachments.filename, mime: attachments.mime, sizeBytes: attachments.sizeBytes, uploader: attachments.uploader, createdAt: attachments.createdAt });
    await logActivity({
      entityType: d.entityType, entityId: d.entityId, actor,
      action: "updated", summary: `uploaded image ${d.filename}`,
    });
    return NextResponse.json({ attachment: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
