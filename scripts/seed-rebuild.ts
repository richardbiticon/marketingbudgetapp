import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { getDb } from "../lib/db";
import { rebuildPositions, rebuildCandidates, rebuildEvents, rebuildGuideline } from "../lib/schema";

// Seeds the MMC Rebuild section from SEED_POSITIONS.json and SEED_GUIDELINE.md.
// Idempotent: wipes and reloads the rebuild tables. Demo candidates are
// clearly fake so every screen renders populated on first run.
async function main() {
  const db = getDb();
  const root = join(__dirname, "..");
  const positions = JSON.parse(readFileSync(join(root, "SEED_POSITIONS.json"), "utf8"));
  const guideline = readFileSync(join(root, "SEED_GUIDELINE.md"), "utf8");

  await db.delete(rebuildEvents);
  await db.delete(rebuildCandidates);
  await db.delete(rebuildPositions);
  await db.delete(rebuildGuideline);

  await db.insert(rebuildGuideline).values({ content: guideline, updatedBy: "Seed" });

  const inserted = [];
  for (const p of positions) {
    const [row] = await db.insert(rebuildPositions).values({
      slug: p.slug, title: p.title, status: p.status, mandate: p.mandate,
      tasksNow: p.tasks_now, tasksLater: p.tasks_later, kpis: p.kpis,
      payMin: p.pay_min, payMax: p.pay_max, payRampNote: p.pay_ramp_note,
      cadence: p.cadence, budgetNote: p.budget_note,
      activatedAt: p.status === "active" ? new Date() : null,
      updatedBy: "Seed",
    }).returning();
    inserted.push(row);
    await db.insert(rebuildEvents).values([
      { positionId: row.id, type: "created", payload: { title: row.title }, actor: "Seed" },
      ...(p.status === "active" ? [{ positionId: row.id, type: "activated" as const, payload: {}, actor: "Seed" }] : []),
    ]);
  }

  const demo = [
    {
      name: "Sample Applicant A", email: "sample.a@example.com", location: "Manila, PH",
      positionId: inserted[0].id, stage: "interview", expectedSalary: 1100,
      scores: { skill: 4, ai_fluency: 3, hunger: 5, comms: 4 },
      notes: "Demo candidate. Replace with real applicants.",
    },
    {
      name: "Sample Applicant B", email: "sample.b@example.com", location: "Cebu, PH",
      positionId: inserted[2].id, stage: "trial_paid", expectedSalary: 1500,
      scores: { skill: 5, ai_fluency: 4, hunger: 4, comms: 3 },
      notes: "Demo candidate. Replace with real applicants.",
    },
    {
      name: "Sample Applicant C", email: "sample.c@example.com", location: "Davao, PH",
      positionId: null, stage: "bench", expectedSalary: 900,
      scores: { skill: 3, ai_fluency: 5, hunger: 5, comms: 4 },
      notes: "Demo candidate on the bench. Replace with real applicants.",
    },
  ];
  for (const c of demo) {
    const [row] = await db.insert(rebuildCandidates).values({ ...c, source: "manual", updatedBy: "Seed" } as any).returning();
    await db.insert(rebuildEvents).values({
      positionId: row.positionId, candidateId: row.id, type: "candidate_added",
      payload: { name: row.name, stage: row.stage }, actor: "Seed",
    });
  }

  console.log(`Seeded ${inserted.length} positions, ${demo.length} demo candidates, and the guideline.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
