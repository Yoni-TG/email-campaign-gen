import type { CampaignType } from "@/lib/types";

export interface MetricWindow {
  start: Date;
  end: Date;
}

/**
 * Per-SKU performance over a window. Rates are 0..1, revenue is in the
 * same currency as the product feed (USD for v1). All fields are
 * non-null at the point of construction; absence is signalled by the
 * SKU being missing from the result map, not by null fields.
 */
export interface ProductMetric {
  sku: string;
  recentClickRate: number;
  recentConversionRate: number;
  recentRevenue: number;
  /** How many email recipients underlie the rate calculations. */
  sampleSize: number;
}

/**
 * Per-(campaign-type, subject-line) open rate, derived from past
 * Klaviyo campaign sends. Used as few-shot fodder in the copy prompt.
 */
export interface SubjectMetric {
  campaignType: CampaignType;
  subject: string;
  openRate: number;
  /** ISO timestamp of the campaign send. Used to break ties / age out. */
  sentAt: string;
}

/**
 * Slim shape of what we keep from `GET /api/campaigns`. The full
 * response is bigger; we only model the fields the metric-sync needs.
 */
export interface KlaviyoCampaign {
  id: string;
  name: string;
  /** Subject line of the first email message attached to the campaign. */
  subject: string;
  channel: "email" | "sms" | "mobile_push";
  /** ISO timestamp of when the campaign was sent. null for unsent. */
  sentAt: string | null;
  status: string;
}

/**
 * Slim shape of one row in `POST /api/campaign-values-reports`. We map
 * Klaviyo's `attributes.results[i].statistics` into this for storage.
 */
export interface CampaignStatistics {
  campaignId: string;
  opens: number;
  opensUnique: number;
  recipients: number;
  /** opensUnique / recipients, 0..1. Pre-computed for convenience. */
  openRate: number;
  clicks: number;
  clicksUnique: number;
  /** clicksUnique / recipients, 0..1. */
  clickRate: number;
  conversions: number;
  /** conversions / recipients, 0..1. */
  conversionRate: number;
  revenue: number;
}

/** Persisted shape of a `klaviyo_metrics` row (post-parse). */
export type KlaviyoMetricScope =
  | { kind: "product"; sku: string }
  | { kind: "subject"; campaignType: CampaignType };

export interface KlaviyoMetricRow {
  id: string;
  scope: string;
  windowStart: Date;
  windowEnd: Date;
  /** JSON blob — `ProductMetric` for product scopes, `SubjectMetric[]` for subject scopes. */
  metrics: ProductMetric | SubjectMetric[];
  fetchedAt: Date;
}

export function encodeProductScope(sku: string): string {
  return `product:${sku}`;
}

export function encodeSubjectScope(campaignType: CampaignType): string {
  return `subject:${campaignType}`;
}

export function parseScope(raw: string): KlaviyoMetricScope | null {
  const [kind, value] = raw.split(":", 2);
  if (kind === "product" && value) {
    return { kind: "product", sku: value };
  }
  if (kind === "subject" && value) {
    return { kind: "subject", campaignType: value as CampaignType };
  }
  return null;
}
