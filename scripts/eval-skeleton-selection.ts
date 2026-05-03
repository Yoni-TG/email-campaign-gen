#!/usr/bin/env tsx
/**
 * Template-selection eval. Runs every brief in `eval/template-briefs.ts`
 * through `selectSkeletons` and reports per-brief picks + diversity
 * metrics across the run.
 *
 *   $ npm run eval:templates              # prints table
 *   $ npm run eval:templates -- --json    # also writes eval/template-results-<ts>.json
 *
 * Metrics:
 *   - type_match_rate       fraction of picks (out of N briefs × 3) whose
 *                           skeleton.campaignTypes contains the brief's
 *                           campaignType. Today's hard-filter baseline = 100%;
 *                           after softening, target ≥80% so the LLM still
 *                           prefers in-type but can wildcard.
 *   - distinct_skeletons    how many of the 15 skeletons appear at least
 *                           once across the run. 15 = full coverage.
 *   - per_brief_in_type     for each brief, how many of its 3 picks are
 *                           in-type (0–3). Distribution shows whether the
 *                           wildcard is rare or common.
 *   - top_skeleton_pct      what % of all picks went to the most-picked
 *                           skeleton. Lower = better (no monopoly).
 *
 * The headline number for "is the operator seeing variety?" is per-type
 * pick distribution: across the 4 briefs of the same type, how many distinct
 * skeleton ids appear in their combined 12 picks. Today this is always 3
 * (the same 3 every time). After softening the filter, we want it higher.
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { EVAL_TEMPLATE_BRIEFS, type TemplateEvalBrief } from "../eval/template-briefs";
import { selectSkeletons } from "../src/modules/email-templates/selection";
import type { CampaignType } from "../src/lib/types";

interface Pick {
  id: string;
  campaignTypes: CampaignType[];
  rationale: string | null;
  inType: boolean;
}

interface BriefResult {
  name: string;
  briefType: CampaignType;
  picks: Pick[];
  inTypeCount: number;
  durationMs: number;
}

async function runBrief(brief: TemplateEvalBrief): Promise<BriefResult> {
  const start = Date.now();
  try {
    const ranked = await selectSkeletons(brief.input);
    const picks: Pick[] = ranked.map((r) => ({
      id: r.skeleton.id,
      campaignTypes: r.skeleton.campaignTypes,
      rationale: r.rationale,
      inType: r.skeleton.campaignTypes.includes(brief.input.campaignType),
    }));
    return {
      name: brief.name,
      briefType: brief.input.campaignType,
      picks,
      inTypeCount: picks.filter((p) => p.inType).length,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    console.error(
      `[eval] ${brief.name} threw: ${err instanceof Error ? err.message : String(err)}`,
    );
    return {
      name: brief.name,
      briefType: brief.input.campaignType,
      picks: [],
      inTypeCount: 0,
      durationMs: Date.now() - start,
    };
  }
}

function pad(s: string, w: number): string {
  return s.length >= w ? s : s + " ".repeat(w - s.length);
}

function printPerBrief(results: BriefResult[]): void {
  console.log("");
  console.log(
    pad("Brief", 38) + pad("Type", 22) + pad("In-type", 8) + "Picks",
  );
  console.log("─".repeat(110));
  for (const r of results) {
    console.log(
      pad(r.name, 38) +
        pad(r.briefType, 22) +
        pad(`${r.inTypeCount}/3`, 8) +
        r.picks.map((p) => (p.inType ? p.id : `~${p.id}`)).join(", "),
    );
  }
  console.log("");
}

function summarize(results: BriefResult[]): {
  totalPicks: number;
  inTypePicks: number;
  typeMatchRate: number;
  distinctSkeletons: number;
  topSkeletonId: string;
  topSkeletonPct: number;
  pickCounts: Record<string, number>;
  perTypeDistinct: Record<CampaignType, number>;
} {
  const pickCounts: Record<string, number> = {};
  const perTypePicks: Record<string, Set<string>> = {};
  let totalPicks = 0;
  let inTypePicks = 0;

  for (const r of results) {
    perTypePicks[r.briefType] ??= new Set();
    for (const pick of r.picks) {
      pickCounts[pick.id] = (pickCounts[pick.id] || 0) + 1;
      perTypePicks[r.briefType]!.add(pick.id);
      totalPicks += 1;
      if (pick.inType) inTypePicks += 1;
    }
  }

  const sortedCounts = Object.entries(pickCounts).sort((a, b) => b[1] - a[1]);
  const topSkeletonId = sortedCounts[0]?.[0] ?? "(none)";
  const topSkeletonCount = sortedCounts[0]?.[1] ?? 0;

  const perTypeDistinct = Object.fromEntries(
    Object.entries(perTypePicks).map(([k, v]) => [k, v.size]),
  ) as Record<CampaignType, number>;

  return {
    totalPicks,
    inTypePicks,
    typeMatchRate: totalPicks > 0 ? inTypePicks / totalPicks : 0,
    distinctSkeletons: Object.keys(pickCounts).length,
    topSkeletonId,
    topSkeletonPct: totalPicks > 0 ? topSkeletonCount / totalPicks : 0,
    pickCounts,
    perTypeDistinct,
  };
}

function printSummary(s: ReturnType<typeof summarize>): void {
  console.log("Summary:");
  console.log(
    `  type_match_rate     ${(s.typeMatchRate * 100).toFixed(0)}%  (${s.inTypePicks}/${s.totalPicks} picks in-type)`,
  );
  console.log(
    `  distinct_skeletons  ${s.distinctSkeletons} / 15`,
  );
  console.log(
    `  top_skeleton        ${s.topSkeletonId}  picked ${s.pickCounts[s.topSkeletonId]} time(s) = ${(s.topSkeletonPct * 100).toFixed(0)}% of all picks`,
  );
  console.log("");
  console.log("  per-type distinct skeletons across the 4 briefs of that type:");
  for (const [type, count] of Object.entries(s.perTypeDistinct)) {
    console.log(`    ${pad(type, 22)} ${count}`);
  }
  console.log("");
  console.log("  pick counts (sorted):");
  for (const [id, count] of Object.entries(s.pickCounts).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`    ${pad(id, 42)} ${count}`);
  }
  console.log("");
}

async function writeJson(
  results: BriefResult[],
  summary: ReturnType<typeof summarize>,
): Promise<string> {
  const dir = join(process.cwd(), "eval");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = join(dir, `template-results-${stamp}.json`);
  await writeFile(path, JSON.stringify({ summary, results }, null, 2), "utf-8");
  return path;
}

async function main() {
  const args = process.argv.slice(2);
  const writeJsonFile = args.includes("--json");

  console.log(`Running ${EVAL_TEMPLATE_BRIEFS.length} template brief(s)…`);
  // Parallel — selectSkeletons is independent per brief.
  const results = await Promise.all(EVAL_TEMPLATE_BRIEFS.map(runBrief));

  printPerBrief(results);
  const summary = summarize(results);
  printSummary(summary);

  if (writeJsonFile) {
    const path = await writeJson(results, summary);
    console.log(`Wrote ${path}`);
  }
}

main().catch((err) => {
  console.error("Eval failed:", err);
  process.exitCode = 1;
});
