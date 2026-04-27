import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { KlaviyoClient } from "@/modules/klaviyo/services/klaviyo-client";
import {
  buildReport,
  extractWinners,
  type WinningSubject,
} from "@/modules/klaviyo/utils/report";
import type { MetricWindow } from "@/modules/klaviyo/types";

/**
 * Pull the last N days of email campaigns from Klaviyo, rank by
 * $/recipient, and rewrite `winning-subjects.json` with the top 15
 * winners. Single-flight — concurrent callers share one in-flight
 * refresh. The function is the unit of work behind both the lazy
 * refresh in `loadWinningSubjects` and the external cron route.
 *
 * Path is configurable via `WINNERS_PATH` env var so deployments
 * with read-only `src/content/` can write to a mounted volume.
 */

export interface SyncWinnersResult {
  windowStart: string;
  windowEnd: string;
  campaignsScanned: number;
  winnersWritten: number;
  path: string;
  fetchedAt: string;
}

interface SyncOptions {
  /** Override the default 90-day window (useful for tests / backfills). */
  windowDays?: number;
  /** Inject a client for tests; production uses the env-configured one. */
  client?: KlaviyoClient;
  /** Override the output path (defaults to `WINNERS_PATH` env or src/content/winning-subjects.json). */
  outputPath?: string;
}

const DEFAULT_WINDOW_DAYS = 90;
const DEFAULT_OUTPUT_PATH = join("src", "content", "winning-subjects.json");

let inFlight: Promise<SyncWinnersResult> | null = null;

export async function syncWinningSubjects(
  options: SyncOptions = {},
): Promise<SyncWinnersResult> {
  if (inFlight) return inFlight;
  inFlight = run(options).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run(options: SyncOptions): Promise<SyncWinnersResult> {
  const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  const end = new Date();
  const start = new Date(end.getTime() - windowDays * 86400_000);
  const window: MetricWindow = { start, end };

  const client = options.client ?? new KlaviyoClient();
  const outputPath =
    options.outputPath ?? process.env.WINNERS_PATH ?? DEFAULT_OUTPUT_PATH;
  const absolutePath = outputPath.startsWith("/")
    ? outputPath
    : join(process.cwd(), outputPath);

  const campaigns = await client.listEmailCampaigns(window);
  const stats =
    campaigns.length > 0
      ? await client.getCampaignValues(
          campaigns.map((c) => c.id),
          window,
        )
      : [];
  const report = buildReport(campaigns, stats, window);
  const winners: WinningSubject[] = extractWinners(report.all);

  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, JSON.stringify(winners, null, 2) + "\n", "utf8");

  return {
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    campaignsScanned: campaigns.length,
    winnersWritten: winners.length,
    path: absolutePath,
    fetchedAt: new Date().toISOString(),
  };
}
