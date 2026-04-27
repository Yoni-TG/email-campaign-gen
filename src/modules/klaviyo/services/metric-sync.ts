import { prisma } from "@/lib/db";
import { CAMPAIGN_TYPES, type CampaignType } from "@/lib/types";
import { KlaviyoClient } from "@/modules/klaviyo/services/klaviyo-client";
import {
  encodeProductScope,
  encodeSubjectScope,
  type CampaignStatistics,
  type KlaviyoCampaign,
  type MetricWindow,
  type ProductMetric,
  type SubjectMetric,
} from "@/modules/klaviyo/types";

const DEFAULT_WINDOW_DAYS = 30;
/** Top-N subjects we surface per campaign type to the copy prompt. */
const SUBJECTS_PER_TYPE = 3;

let inFlight: Promise<SyncResult> | null = null;

export interface SyncResult {
  windowStart: string;
  windowEnd: string;
  productScopesWritten: number;
  subjectScopesWritten: number;
  fetchedAt: string;
}

interface SyncOptions {
  /** Override the default 30-day window. Useful for tests / backfills. */
  window?: MetricWindow;
  /** Inject a client for tests; production uses the env-configured one. */
  client?: KlaviyoClient;
  /**
   * Map a campaign id → its CampaignType. Required for subject-scope
   * bucketing. Production callers pass `inferCampaignType` which uses
   * a heuristic over the campaign name; tests can pass a fake.
   */
  classifyCampaign?: (campaign: KlaviyoCampaign) => CampaignType | null;
}

export async function syncKlaviyoMetrics(
  options: SyncOptions = {},
): Promise<SyncResult> {
  if (inFlight) return inFlight;

  inFlight = run(options).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run(options: SyncOptions): Promise<SyncResult> {
  const window = options.window ?? defaultWindow();
  const client = options.client ?? new KlaviyoClient();
  const classify = options.classifyCampaign ?? inferCampaignType;

  const campaigns = await client.listEmailCampaigns(window);
  const stats =
    campaigns.length > 0
      ? await client.getCampaignValues(
          campaigns.map((c) => c.id),
          window,
        )
      : [];

  const subjectScopes = buildSubjectScopes(campaigns, stats, classify);
  const productScopes = buildProductScopes(campaigns, stats);

  const fetchedAt = new Date();

  await prisma.$transaction([
    ...subjectScopes.map((row) =>
      prisma.klaviyoMetric.upsert({
        where: {
          scope_windowStart: {
            scope: row.scope,
            windowStart: window.start,
          },
        },
        update: {
          windowEnd: window.end,
          metrics: JSON.stringify(row.metrics),
          fetchedAt,
        },
        create: {
          scope: row.scope,
          windowStart: window.start,
          windowEnd: window.end,
          metrics: JSON.stringify(row.metrics),
          fetchedAt,
        },
      }),
    ),
    ...productScopes.map((row) =>
      prisma.klaviyoMetric.upsert({
        where: {
          scope_windowStart: {
            scope: row.scope,
            windowStart: window.start,
          },
        },
        update: {
          windowEnd: window.end,
          metrics: JSON.stringify(row.metrics),
          fetchedAt,
        },
        create: {
          scope: row.scope,
          windowStart: window.start,
          windowEnd: window.end,
          metrics: JSON.stringify(row.metrics),
          fetchedAt,
        },
      }),
    ),
  ]);

  return {
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    productScopesWritten: productScopes.length,
    subjectScopesWritten: subjectScopes.length,
    fetchedAt: fetchedAt.toISOString(),
  };
}

function defaultWindow(): MetricWindow {
  const end = new Date();
  const start = new Date(end.getTime() - DEFAULT_WINDOW_DAYS * 86400_000);
  return { start, end };
}

function buildSubjectScopes(
  campaigns: KlaviyoCampaign[],
  stats: CampaignStatistics[],
  classify: (campaign: KlaviyoCampaign) => CampaignType | null,
): Array<{ scope: string; metrics: SubjectMetric[] }> {
  const statsById = new Map(stats.map((s) => [s.campaignId, s]));
  const buckets = new Map<CampaignType, SubjectMetric[]>();

  for (const c of campaigns) {
    const type = classify(c);
    if (!type || !c.subject || !c.sentAt) continue;
    const stat = statsById.get(c.id);
    if (!stat) continue;
    const list = buckets.get(type) ?? [];
    list.push({
      campaignType: type,
      subject: c.subject,
      openRate: stat.openRate,
      sentAt: c.sentAt,
    });
    buckets.set(type, list);
  }

  const out: Array<{ scope: string; metrics: SubjectMetric[] }> = [];
  for (const type of CAMPAIGN_TYPES) {
    const rows = buckets.get(type);
    if (!rows || rows.length === 0) continue;
    const top = [...rows]
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, SUBJECTS_PER_TYPE);
    out.push({ scope: encodeSubjectScope(type), metrics: top });
  }
  return out;
}

/**
 * Per-SKU performance aggregation. Klaviyo's `campaign-values-reports`
 * is per-campaign, not per-SKU — pulling SKU-granular data needs the
 * `query_metric_aggregates` endpoint on the `Placed Order` metric and a
 * `$value` group-by-product key. That work is gated on workspace-level
 * config (which metric id corresponds to "Placed Order" in this
 * tenant), so v1 of the sync produces an empty product-scope set and
 * leaves the wiring in place for later.
 */
function buildProductScopes(
  _campaigns: KlaviyoCampaign[],
  _stats: CampaignStatistics[],
): Array<{ scope: string; metrics: ProductMetric }> {
  return [];
}

// Quick keyword heuristic — good enough as a v1 default. Replace with a
// proper classifier (or operator-tagged campaigns) once we have data.
function inferCampaignType(c: KlaviyoCampaign): CampaignType | null {
  const haystack = `${c.name} ${c.subject}`.toLowerCase().trim();
  if (haystack.length === 0) return null;
  if (/(sale|promo|discount|% off|deal)/.test(haystack)) return "sale_promo";
  if (/(launch|new in|introducing|new arrival)/.test(haystack))
    return "product_launch";
  if (/(holiday|christmas|easter|valentine|mother|father|gift)/.test(haystack))
    return "holiday_seasonal";
  if (/(collection|capsule|edit)/.test(haystack)) return "collection_spotlight";
  return "editorial";
}

/** Test-only export for the heuristic — stable contract for the test. */
export const __testing = { inferCampaignType, buildSubjectScopes };

// Use scope helpers downstream when reading metrics back.
export { encodeProductScope };
