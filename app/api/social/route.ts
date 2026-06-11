import { NextRequest, NextResponse } from "next/server";
import { like, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { socialPosts } from "@/lib/schema";
import { socialInput } from "@/lib/validation";
import { actorFrom, logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const month = req.nextUrl.searchParams.get("month");
    const rows = await db
      .select()
      .from(socialPosts)
      .where(month ? like(socialPosts.postDate, `${month}-%`) : undefined)
      .orderBy(asc(socialPosts.postDate));
    return NextResponse.json({ posts: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const parsed = socialInput.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const [row] = await db
      .insert(socialPosts)
      .values({
        postDate: d.postDate, pillar: d.pillar, concept: d.concept,
        caption: d.caption ?? null, format: d.format ?? null, status: d.status, owner: d.owner ?? actor,
      })
      .returning();
    await logActivity({
      entityType: "campaigns", entityId: row.postDate.slice(0, 7), actor,
      action: "created", summary: `planned post "${row.concept}" for ${row.postDate}`,
    });
    return NextResponse.json({ post: row }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
