import type {
  CampaignStatistics,
  KlaviyoCampaign,
  MetricWindow,
} from "@/modules/klaviyo/types";

export interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  sentAt: string | null;
  recipients: number;
  delivered: number;
  /** Bounces / recipients. 0..1. */
  bounceRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
  revenuePerRecipient: number;
}

export interface ReportSummary {
  windowStart: string;
  windowEnd: string;
  totalCampaigns: number;
  campaignsWithStats: number;
  totalRecipients: number;
  totalRevenue: number;
  meanOpenRate: number;
  medianOpenRate: number;
  meanClickRate: number;
  medianClickRate: number;
  meanConversionRate: number;
  meanRecipients: number;
}

export interface ReportData {
  summary: ReportSummary;
  /** All joined rows, sorted by sentAt desc. */
  all: CampaignRow[];
  topByOpenRate: CampaignRow[];
  topByClickRate: CampaignRow[];
  topByConversionRate: CampaignRow[];
  topByRevenue: CampaignRow[];
  topByRevenuePerRecipient: CampaignRow[];
  bottomByOpenRate: CampaignRow[];
}

export interface BuildReportOptions {
  /** How many rows to include in each top-N list. Default 10. */
  topN?: number;
  /** How many rows in the bottom-N list. Default 5. */
  bottomN?: number;
  /**
   * Drop campaigns with fewer than this many recipients before
   * ranking — small sends produce noisy rates that crowd out the
   * signal. Default 100.
   */
  minRecipients?: number;
}

export function buildReport(
  campaigns: KlaviyoCampaign[],
  stats: CampaignStatistics[],
  window: MetricWindow,
  options: BuildReportOptions = {},
): ReportData {
  const topN = options.topN ?? 10;
  const bottomN = options.bottomN ?? 5;
  const minRecipients = options.minRecipients ?? 100;

  const statsById = new Map(stats.map((s) => [s.campaignId, s]));
  const all: CampaignRow[] = campaigns
    .map((c) => {
      const stat = statsById.get(c.id);
      if (!stat) return null;
      const bounced = Math.max(0, stat.recipients - stat.delivered);
      return {
        id: c.id,
        name: c.name,
        subject: c.subject,
        sentAt: c.sentAt,
        recipients: stat.recipients,
        delivered: stat.delivered,
        bounceRate: stat.recipients > 0 ? bounced / stat.recipients : 0,
        openRate: stat.openRate,
        clickRate: stat.clickRate,
        conversionRate: stat.conversionRate,
        revenue: stat.revenue,
        revenuePerRecipient: stat.revenuePerRecipient,
      } satisfies CampaignRow;
    })
    .filter((row): row is CampaignRow => row !== null)
    .sort((a, b) => sentAtDesc(a.sentAt, b.sentAt));

  const ranked = all.filter((r) => r.recipients >= minRecipients);

  const summary: ReportSummary = {
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    totalCampaigns: campaigns.length,
    campaignsWithStats: all.length,
    totalRecipients: all.reduce((acc, r) => acc + r.recipients, 0),
    totalRevenue: all.reduce((acc, r) => acc + r.revenue, 0),
    meanOpenRate: mean(ranked.map((r) => r.openRate)),
    medianOpenRate: median(ranked.map((r) => r.openRate)),
    meanClickRate: mean(ranked.map((r) => r.clickRate)),
    medianClickRate: median(ranked.map((r) => r.clickRate)),
    meanConversionRate: mean(ranked.map((r) => r.conversionRate)),
    meanRecipients: mean(ranked.map((r) => r.recipients)),
  };

  return {
    summary,
    all,
    topByOpenRate: take(ranked, (r) => r.openRate, topN, "desc"),
    topByClickRate: take(ranked, (r) => r.clickRate, topN, "desc"),
    topByConversionRate: take(ranked, (r) => r.conversionRate, topN, "desc"),
    topByRevenue: take(ranked, (r) => r.revenue, topN, "desc"),
    topByRevenuePerRecipient: take(
      ranked,
      (r) => r.revenuePerRecipient,
      topN,
      "desc",
    ),
    bottomByOpenRate: take(ranked, (r) => r.openRate, bottomN, "asc"),
  };
}

function take(
  rows: CampaignRow[],
  metric: (r: CampaignRow) => number,
  n: number,
  direction: "asc" | "desc",
): CampaignRow[] {
  const sign = direction === "desc" ? -1 : 1;
  return [...rows]
    .sort((a, b) => sign * (metric(a) - metric(b)))
    .slice(0, n);
}

function sentAtDesc(a: string | null, b: string | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b.localeCompare(a);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
