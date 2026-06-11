import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { attachments } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serve the raw image bytes.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const [row] = await db.select().from(attachments).where(eq(attachments.id, params.id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const buf = Buffer.from(row.data, "base64");
    return new NextResponse(buf, {
      headers: {
        "Content-Type": row.mime,
        "Content-Length": String(buf.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const [row] = await db.delete(attachments).where(eq(attachments.id, params.id)).returning({ id: attachments.id });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
