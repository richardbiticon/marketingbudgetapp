import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "@/lib/db";
import { attachments } from "@/lib/schema";
import { actorFrom } from "@/lib/activity";
import { EMPTY_PROFILE } from "@/lib/rebuild";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/*
  Talent profile extraction. Accepts a profiling PDF (or PNG/JPG screenshots),
  stores the file (served from /api/attachments/[id]; swap to Vercel Blob is a
  one-function change), and sends it to the Anthropic API for a strict
  JSON-only profile extraction. Nulls for anything not present, never invented
  values. Without ANTHROPIC_API_KEY the upload still works and the client
  falls back to manual entry.
*/

const PROFILE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    address: { type: ["string", "null"] },
    role_applied: { type: ["string", "null"] },
    expected_salary_usd: { type: ["number", "null"] },
    portfolio_url: { type: ["string", "null"] },
    olj_profile_url: { type: ["string", "null"] },
    years_experience: { type: ["number", "null"] },
    tools: { type: "array", items: { type: "string" } },
    ai_tools: { type: "array", items: { type: "string" } },
    work_history: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        properties: {
          company: { type: ["string", "null"] },
          role: { type: ["string", "null"] },
          duration: { type: ["string", "null"] },
        },
        required: ["company", "role", "duration"],
      },
    },
    education: { type: ["string", "null"] },
    availability: { type: ["string", "null"] },
    answers: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        properties: {
          question: { type: ["string", "null"] },
          answer: { type: ["string", "null"] },
        },
        required: ["question", "answer"],
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    flags: { type: "array", items: { type: "string" } },
    summary: { type: ["string", "null"] },
  },
  required: [
    "name", "email", "location", "address", "role_applied", "expected_salary_usd",
    "portfolio_url", "olj_profile_url", "years_experience", "tools", "ai_tools",
    "work_history", "education", "availability", "answers", "strengths", "flags", "summary",
  ],
} as const;

const EXTRACTION_PROMPT =
  "Extract the candidate profile from this document. Return only JSON matching the schema. " +
  "Use null for anything not present in the document. Never invent or guess values. " +
  "expected_salary_usd is monthly USD as a number. flags are concerns worth a second look. " +
  "summary is 2 or 3 plain sentences about who this person is professionally.";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const { filename, mime, dataBase64 } = await req.json().catch(() => ({}));
    if (!dataBase64 || !mime) {
      return NextResponse.json({ error: "filename, mime, and dataBase64 required" }, { status: 400 });
    }
    const isPdf = mime === "application/pdf";
    const isImage = /^image\/(png|jpe?g|webp)$/.test(mime);
    if (!isPdf && !isImage) {
      return NextResponse.json({ error: "PDF or PNG/JPG only" }, { status: 400 });
    }
    if (dataBase64.length > 4_200_000) {
      return NextResponse.json({ error: "File too large. Keep it under ~3 MB." }, { status: 400 });
    }

    // 1. Store the source file so the profile page can link to it.
    const [att] = await db.insert(attachments).values({
      entityType: "talent-source", entityId: "intake",
      filename: String(filename ?? (isPdf ? "profile.pdf" : "screenshot")).slice(0, 200),
      mime, data: dataBase64, sizeBytes: Math.floor(dataBase64.length * 0.75), uploader: actor,
    }).returning({ id: attachments.id });
    const sourceUrl = `/api/attachments/${att.id}`;

    // 2. Extract with Claude. Missing key degrades to manual entry.
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        sourceUrl, profile: EMPTY_PROFILE, extracted: false,
        notice: "ANTHROPIC_API_KEY is not set. File saved; fill the profile manually.",
      });
    }

    const client = new Anthropic();
    const contentBlock = isPdf
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: dataBase64 } }
      : { type: "image" as const, source: { type: "base64" as const, media_type: mime as "image/png" | "image/jpeg" | "image/webp", data: dataBase64 } };

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      thinking: { type: "disabled" },
      output_config: { format: { type: "json_schema", schema: PROFILE_SCHEMA as any } },
      messages: [{ role: "user", content: [contentBlock, { type: "text", text: EXTRACTION_PROMPT }] }],
    });

    const text = response.content.find((b) => b.type === "text");
    const profile = text ? JSON.parse(text.text) : EMPTY_PROFILE;
    return NextResponse.json({ sourceUrl, profile, extracted: true });
  } catch (e: any) {
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Extraction failed (${e.status}). Try again or fill manually.` }, { status: 502 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
