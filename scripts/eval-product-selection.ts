#!/usr/bin/env tsx
/**
 * Product-selection eval. Runs every brief in `eval/briefs.ts` through
 * `selectProducts` and reports a per-brief + summary metrics table.
 *
 *   $ npm run eval:products              # baseline run, prints table
 *   $ npm run eval:products -- --json    # also writes eval/results-<ts>.json
 *   $ npm run eval:products -- --filter mens   # only briefs whose name contains "mens"
 *
 * Metrics surfaced:
 *   - audience_match         fraction of picked SKUs whose shop_for
 *                            overlaps the brief's expectedAudience
 *   - category_match         fraction whose productType ∈ targetCategories
 *                            (should be 100% — stage-1 filter is the
 *                            gate, so a regression here = filter bug)
 *   - distinct_price_tiers   spread among picks (target ≥2)
 *   - personalization_match  fraction with personalizationSummary != null
 *                            for briefs where leadValue ∈ {family_first,
 *                            meaningful_moments}
 *   - duration_ms            wall time of the call
 *
 * The audience metric is the headline number — the men/women regression
 * we're trying to fix shows up here directly.
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { EVAL_BRIEFS, type EvalBrief } from "../eval/briefs";
import { selectProducts } from "../src/modules/products/services/product-selection";
import {
  ensureFeedLoaded,
  getProductBySku,
} from "../src/modules/products/services/product-feed";
import type { ProductSnapshot } from "../src/lib/types";

interface BriefResult {
  name: string;
  picks: ProductSnapshot[];
  audienceMatch: number;
  categoryMatch: number;
  distinctPriceTiers: number;
  personalizationMatch: number | null;
  durationMs: number;
  audienceMisses: Array<{ sku: string; name: string; shopFor: string[] }>;
}

const PERSONALIZATION_LEAD_VALUES = new Set(["family_first", "meaningful_moments"]);

function audienceOverlap(
  pickedShopFor: string[],
  expected: string[],
): boolean {
  if (expected.length === 0) return true;
  const expectedSet = new Set(expected);
  return pickedShopFor.some((s) => expectedSet.has(s));
}

function evalOne(
  brief: EvalBrief,
  picks: ProductSnapshot[],
  durationMs: number,
): BriefResult {
  const targetCategorySet = new Set(
    brief.seed.targetCategories.map((c) => c.toLowerCase()),
  );
  const expectedSet = new Set<string>(brief.expectedAudience);

  let audienceHits = 0;
  let categoryHits = 0;
  let personalizationHits = 0;
  const tierSet = new Set<string>();
  const misses: BriefResult["audienceMisses"] = [];

  for (const pick of picks) {
    // shop_for lives on the digested record, not the snapshot — look it up.
    const digested = getProductBySku(pick.sku);
    const shopFor = digested?.shopFor ?? [];

    if (audienceOverlap(shopFor, brief.expectedAudience)) {
      audienceHits += 1;
    } else {
      misses.push({ sku: pick.sku, name: pick.name, shopFor });
    }

    const types = pick.productType.map((t) => t.toLowerCase());
    if (types.some((t) => targetCategorySet.has(t))) categoryHits += 1;

    tierSet.add(pick.priceTier);
    if (pick.personalizationSummary !== null) personalizationHits += 1;
  }

  const total = Math.max(picks.length, 1);
  const personalizationApplies = PERSONALIZATION_LEAD_VALUES.has(
    brief.seed.leadValue,
  );

  return {
    name: brief.name,
    picks,
    audienceMatch: audienceHits / total,
    categoryMatch: categoryHits / total,
    distinctPriceTiers: tierSet.size,
    personalizationMatch: personalizationApplies
      ? personalizationHits / total
      : null,
    durationMs,
    audienceMisses: misses,
  };
}

async function runBrief(brief: EvalBrief): Promise<BriefResult> {
  const start = Date.now();
  try {
    const picks = await selectProducts(
      brief.seed,
      brief.campaignType,
      brief.count,
    );
    return evalOne(brief, picks, Date.now() - start);
  } catch (err) {
    console.error(
      `[eval] ${brief.name} threw: ${err instanceof Error ? err.message : String(err)}`,
    );
    return evalOne(brief, [], Date.now() - start);
  }
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

function pad(s: string, w: number, align: "left" | "right" = "left"): string {
  if (s.length >= w) return s;
  return align === "left" ? s + " ".repeat(w - s.length) : " ".repeat(w - s.length) + s;
}

function printTable(results: BriefResult[]): void {
  const cols = [
    { h: "Brief", w: 32, get: (r: BriefResult) => r.name },
    { h: "Audience", w: 9, get: (r: BriefResult) => pct(r.audienceMatch) },
    { h: "Category", w: 9, get: (r: BriefResult) => pct(r.categoryMatch) },
    { h: "Tiers", w: 6, get: (r: BriefResult) => String(r.distinctPriceTiers) },
    {
      h: "Personalization",
      w: 16,
      get: (r: BriefResult) =>
        r.personalizationMatch === null ? "—" : pct(r.personalizationMatch),
    },
    { h: "ms", w: 6, get: (r: BriefResult) => String(r.durationMs) },
  ];

  console.log("");
  console.log(cols.map((c) => pad(c.h, c.w)).join("  "));
  console.log(cols.map((c) => "─".repeat(c.w)).join("  "));
  for (const r of results) {
    console.log(cols.map((c) => pad(c.get(r), c.w)).join("  "));
  }
  console.log("");
}

function summarize(results: BriefResult[]): {
  avgAudience: number;
  avgCategory: number;
  avgTiers: number;
  p95DurationMs: number;
  briefsBelow90Audience: string[];
} {
  const n = results.length || 1;
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / n;
  const sorted = [...results].sort((a, b) => a.durationMs - b.durationMs);
  const p95Index = Math.min(results.length - 1, Math.ceil(results.length * 0.95) - 1);

  return {
    avgAudience: avg(results.map((r) => r.audienceMatch)),
    avgCategory: avg(results.map((r) => r.categoryMatch)),
    avgTiers: avg(results.map((r) => r.distinctPriceTiers)),
    p95DurationMs: sorted[Math.max(0, p95Index)]?.durationMs ?? 0,
    briefsBelow90Audience: results
      .filter((r) => r.audienceMatch < 0.9)
      .map((r) => r.name),
  };
}

function printMisses(results: BriefResult[]): void {
  const failing = results.filter((r) => r.audienceMisses.length > 0);
  if (failing.length === 0) return;
  console.log("Audience misses (first 3 per brief):");
  for (const r of failing) {
    console.log(`  ${r.name}:`);
    for (const m of r.audienceMisses.slice(0, 3)) {
      console.log(
        `    - ${m.sku} ${JSON.stringify(m.name).slice(0, 60)} ` +
          `shop_for=[${m.shopFor.join(", ")}]`,
      );
    }
    if (r.audienceMisses.length > 3) {
      console.log(`    … and ${r.audienceMisses.length - 3} more`);
    }
  }
  console.log("");
}

async function writeJson(results: BriefResult[]): Promise<string> {
  const dir = join(process.cwd(), "eval");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = join(dir, `results-${stamp}.json`);
  const summary = summarize(results);
  await writeFile(
    path,
    JSON.stringify({ summary, results }, null, 2),
    "utf-8",
  );
  return path;
}

async function main() {
  const args = process.argv.slice(2);
  const filterIdx = args.indexOf("--filter");
  const filter = filterIdx >= 0 ? args[filterIdx + 1] : null;
  const writeJsonFile = args.includes("--json");

  const briefs = filter
    ? EVAL_BRIEFS.filter((b) => b.name.includes(filter))
    : EVAL_BRIEFS;

  if (briefs.length === 0) {
    console.error(`No briefs match filter "${filter}"`);
    process.exit(1);
  }

  console.log(`Loading product feed…`);
  await ensureFeedLoaded();

  console.log(`Running ${briefs.length} brief(s)…`);
  // Parallel — Anthropic comfortably handles 5+ concurrent for short calls.
  // withRetry inside selectProducts handles transient 429s.
  const results = await Promise.all(briefs.map(runBrief));

  printTable(results);
  const summary = summarize(results);
  console.log("Summary:");
  console.log(`  avg audience match    ${pct(summary.avgAudience)}`);
  console.log(`  avg category match    ${pct(summary.avgCategory)}`);
  console.log(`  avg price tiers/pick  ${summary.avgTiers.toFixed(1)}`);
  console.log(`  p95 duration          ${summary.p95DurationMs} ms`);
  if (summary.briefsBelow90Audience.length > 0) {
    console.log(
      `  briefs below 90% audience match (${summary.briefsBelow90Audience.length}): ${summary.briefsBelow90Audience.join(", ")}`,
    );
  }
  console.log("");

  printMisses(results);

  if (writeJsonFile) {
    const path = await writeJson(results);
    console.log(`Wrote ${path}`);
  }
}

main().catch((err) => {
  console.error("Eval failed:", err);
  process.exitCode = 1;
});
