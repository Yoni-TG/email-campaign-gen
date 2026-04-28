#!/usr/bin/env tsx
/**
 * Phase C1 — Klaviyo discovery report. Pulls past N days of email
 * campaigns + their stats and dumps a markdown + JSON report we can
 * eyeball before deciding what's worth feeding into the prompt.
 *
 * Read-only. No DB writes. Safe to run as often as the rate limit
 * allows (1 req/s burst, 2/min steady, 225/day for the values endpoint).
 *
 * Usage:
 *   npx tsx scripts/klaviyo-report.ts                # last 90 days
 *   npx tsx scripts/klaviyo-report.ts --days 30
 *   npx tsx scripts/klaviyo-report.ts --out tmp/foo  # writes foo.md + foo.json
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { KlaviyoClient } from "../src/modules/klaviyo/services/klaviyo-client";
import type { MetricWindow } from "../src/modules/klaviyo/types";
import { buildReport, extractWinners } from "../src/modules/klaviyo/utils/report";
import { formatReportAsMarkdown } from "../src/modules/klaviyo/utils/report-format";

interface Args {
  days: number;
  outBase: string;
  topN: number;
  bottomN: number;
  minRecipients: number;
  listMetrics: boolean;
  writeWinners: string | null;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    days: 90,
    outBase: "out/klaviyo-report",
    topN: 10,
    bottomN: 5,
    minRecipients: 100,
    listMetrics: false,
    writeWinners: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--days":
        out.days = Number(next);
        i++;
        break;
      case "--out":
        out.outBase = next;
        i++;
        break;
      case "--top":
        out.topN = Number(next);
        i++;
        break;
      case "--bottom":
        out.bottomN = Number(next);
        i++;
        break;
      case "--min-recipients":
        out.minRecipients = Number(next);
        i++;
        break;
      case "--list-metrics":
        out.listMetrics = true;
        break;
      case "--write-winners":
        if (next && !next.startsWith("--")) {
          out.writeWinners = next;
          i++;
        } else {
          out.writeWinners = "src/content/winning-subjects.json";
        }
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }
  if (!Number.isFinite(out.days) || out.days <= 0) {
    throw new Error(`--days must be a positive number; got ${out.days}`);
  }
  return out;
}

function printHelp(): void {
  console.log(
    [
      "Klaviyo discovery report.",
      "",
      "Options:",
      "  --days <n>             Window size in days (default 90)",
      "  --out <path>           Output basename (writes <path>.md + <path>.json)",
      "  --top <n>              Rows in each top-N table (default 10)",
      "  --bottom <n>           Rows in the bottom-N table (default 5)",
      "  --min-recipients <n>   Drop sends below this size before ranking (default 100)",
      "  --list-metrics         Print every metric in the workspace (id, name, integration) and exit",
      "  --write-winners [path] Also emit a curated winners JSON the copy prompt consumes",
      "                         (default: src/content/winning-subjects.json)",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const client = new KlaviyoClient();

  if (args.listMetrics) {
    const metrics = await client.listMetrics();
    console.log(`[klaviyo-report] ${metrics.length} metrics in this workspace:`);
    const sorted = [...metrics].sort((a, b) => a.name.localeCompare(b.name));
    for (const m of sorted) {
      const tag = m.integration ? ` (${m.integration})` : "";
      console.log(`  ${m.id}  ${m.name}${tag}`);
    }
    return;
  }

  const end = new Date();
  const start = new Date(end.getTime() - args.days * 86400_000);
  const window: MetricWindow = { start, end };

  console.log(
    `[klaviyo-report] window: ${start.toISOString()} → ${end.toISOString()}`,
  );

  console.log("[klaviyo-report] listing campaigns…");
  const campaigns = await client.listEmailCampaigns(window);
  console.log(`[klaviyo-report] found ${campaigns.length} email campaigns`);

  if (campaigns.length === 0) {
    console.log("[klaviyo-report] nothing to report.");
    return;
  }

  console.log("[klaviyo-report] fetching campaign-values…");
  const stats = await client.getCampaignValues(
    campaigns.map((c) => c.id),
    window,
  );
  console.log(`[klaviyo-report] got stats for ${stats.length} campaigns`);

  const report = buildReport(campaigns, stats, window, {
    topN: args.topN,
    bottomN: args.bottomN,
    minRecipients: args.minRecipients,
  });

  const mdPath = resolve(`${args.outBase}.md`);
  const jsonPath = resolve(`${args.outBase}.json`);
  await mkdir(dirname(mdPath), { recursive: true });
  await writeFile(mdPath, formatReportAsMarkdown(report), "utf8");
  await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`[klaviyo-report] wrote ${mdPath}`);
  console.log(`[klaviyo-report] wrote ${jsonPath}`);

  if (args.writeWinners) {
    const winners = extractWinners(report.all);
    const winnersPath = resolve(args.writeWinners);
    await mkdir(dirname(winnersPath), { recursive: true });
    await writeFile(winnersPath, JSON.stringify(winners, null, 2) + "\n", "utf8");
    console.log(
      `[klaviyo-report] wrote ${winnersPath} (${winners.length} winners)`,
    );
  }
}

main().catch((err) => {
  console.error("[klaviyo-report] failed:");
  console.error(err);
  process.exit(1);
});
