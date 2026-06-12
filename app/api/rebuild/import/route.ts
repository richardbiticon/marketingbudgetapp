import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { getDb } from "@/lib/db";
import { rebuildCandidates, rebuildImports } from "@/lib/schema";
import { actorFrom } from "@/lib/activity";
import { writeRebuildEvent } from "@/lib/rebuild";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  CSV import, v1 of sheet tracking. Two modes in one endpoint:
  1. No mapping: parse the CSV server side and return detected headers plus a
     small preview so the client can render the column-mapping step.
  2. With mapping: create candidates at stage "applied" (source "csv") and
     write one csv_imported event with the row count.
  Direct Google Sheets sync is later; the source field keeps them separable.
*/


export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const actor = actorFrom(req);
    const b = await req.json().catch(() => ({}));
    const { positionId, filename, csvText, mapping } = b;
    if (!csvText || typeof csvText !== "string") {
      return NextResponse.json({ error: "csvText required" }, { status: 400 });
    }

    const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
    const headers = parsed.meta.fields ?? [];
    const rows = parsed.data;

    if (!mapping) {
      return NextResponse.json({ headers, rowCount: rows.length, preview: rows.slice(0, 3) });
    }

    if (!positionId) return NextResponse.json({ error: "positionId required" }, { status: 400 });

    // mapping: { [csvHeader]: targetField }
    const get = (row: Record<string, string>, target: string): string[] => {
      return Object.entries(mapping)
        .filter(([, t]) => t === target)
        .map(([h]) => (row[h] ?? "").trim())
        .filter(Boolean);
    };

    let imported = 0;
    for (const row of rows) {
      const name = get(row, "name")[0];
      if (!name) continue;
      const answers = get(row, "answers");
      const salaryRaw = get(row, "expectedSalary")[0];
      const salary = salaryRaw ? Math.round(Number(salaryRaw.replace(/[^0-9.]/g, ""))) : null;
      await db.insert(rebuildCandidates).values({
        positionId,
        name: name.slice(0, 120),
        email: get(row, "email")[0] ?? null,
        location: get(row, "location")[0] ?? null,
        expectedSalary: Number.isFinite(salary as number) && salary ? salary : null,
        portfolioUrl: get(row, "portfolioUrl")[0] ?? null,
        oljProfileUrl: get(row, "oljProfileUrl")[0] ?? null,
        stage: "applied",
        source: "csv",
        notes: answers.length ? "Answers:\n" + answers.join("\n---\n") : null,
        updatedBy: actor,
      });
      imported++;
    }

    await db.insert(rebuildImports).values({
      positionId, filename: String(filename ?? "import.csv").slice(0, 200), rowCount: imported, actor,
    });
    await writeRebuildEvent({
      positionId, type: "csv_imported",
      payload: { filename: filename ?? "import.csv", rows: imported }, actor,
    });

    return NextResponse.json({ ok: true, imported });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
