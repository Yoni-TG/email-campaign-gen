import type {
  CampaignStatistics,
  KlaviyoCampaign,
  MetricWindow,
} from "@/modules/klaviyo/types";

const BASE_URL = "https://a.klaviyo.com";
const DEFAULT_REVISION = "2026-04-15";

export class KlaviyoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KlaviyoConfigError";
  }
}

export class KlaviyoApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    message: string,
  ) {
    super(message);
    this.name = "KlaviyoApiError";
  }
}

interface ClientOptions {
  apiKey?: string;
  revision?: string;
  fetchImpl?: typeof fetch;
  conversionMetricId?: string;
}

export class KlaviyoClient {
  private readonly apiKey: string;
  private readonly revision: string;
  private readonly fetchImpl: typeof fetch;
  private conversionMetricId: string | null = null;

  constructor(options: ClientOptions = {}) {
    const apiKey = options.apiKey ?? process.env.KLAVIYO_API_KEY;
    if (!apiKey) {
      throw new KlaviyoConfigError(
        "KLAVIYO_API_KEY is not set. Add it to .env.local.",
      );
    }
    this.apiKey = apiKey;
    this.revision =
      options.revision ?? process.env.KLAVIYO_API_REVISION ?? DEFAULT_REVISION;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.conversionMetricId =
      options.conversionMetricId ??
      process.env.KLAVIYO_CONVERSION_METRIC_ID ??
      null;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Klaviyo-API-Key ${this.apiKey}`);
    headers.set("revision", this.revision);
    headers.set("Accept", "application/vnd.api+json");
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/vnd.api+json");
    }

    const response = await this.fetchImpl(`${BASE_URL}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new KlaviyoApiError(
        response.status,
        body,
        `Klaviyo ${init.method ?? "GET"} ${path} → ${response.status}`,
      );
    }

    return (await response.json()) as T;
  }

  /**
   * Lists email campaigns sent within `window`. Pagination is followed
   * automatically; callers receive the flattened list.
   *
   * Klaviyo requires a channel filter on this resource. We constrain
   * by `scheduled_at` (filterable; for sent campaigns equals send_time)
   * and `status='Sent'` to skip drafts. `send_time` itself isn't
   * filterable per the Klaviyo API contract, but it's still on the
   * response so callers see the real send timestamp.
   */
  async listEmailCampaigns(window: MetricWindow): Promise<KlaviyoCampaign[]> {
    const filter = [
      `equals(messages.channel,'email')`,
      `equals(status,'Sent')`,
      `greater-or-equal(scheduled_at,${window.start.toISOString()})`,
      `less-than(scheduled_at,${window.end.toISOString()})`,
    ].join(",");

    const out: KlaviyoCampaign[] = [];
    let cursor: string | null = null;

    do {
      const params = new URLSearchParams({
        filter: `and(${filter})`,
        include: "campaign-messages",
      });
      if (cursor) params.set("page[cursor]", cursor);

      const page = await this.request<KlaviyoCampaignsResponse>(
        `/api/campaigns?${params.toString()}`,
      );

      for (const row of page.data) {
        const subject = pickSubjectFromIncluded(row, page.included ?? []);
        out.push({
          id: row.id,
          name: row.attributes.name,
          subject,
          channel: "email",
          sentAt: row.attributes.send_time ?? null,
          status: row.attributes.status,
        });
      }

      cursor = extractCursor(page.links?.next);
    } while (cursor);

    return out;
  }

  /**
   * Lists all metrics in the workspace. Used by `--list-metrics` and
   * by `resolveConversionMetricId()` to scan client-side.
   */
  async listMetrics(): Promise<Array<{ id: string; name: string; integration: string | null }>> {
    let cursor: string | null = null;
    const out: Array<{ id: string; name: string; integration: string | null }> = [];
    do {
      const params = new URLSearchParams();
      if (cursor) params.set("page[cursor]", cursor);
      const path = params.toString()
        ? `/api/metrics?${params.toString()}`
        : `/api/metrics`;
      const response = await this.request<MetricsResponse>(path);
      for (const m of response.data ?? []) {
        out.push({
          id: m.id,
          name: m.attributes?.name ?? "",
          integration: m.attributes?.integration?.name ?? null,
        });
      }
      cursor = extractCursor(response.links?.next);
    } while (cursor);
    return out;
  }

  /**
   * Resolves the conversion metric id to use on values reports.
   * Uses `KLAVIYO_CONVERSION_METRIC_ID` if set; otherwise lists the
   * workspace's metrics and picks the one named "Placed Order" — the
   * default conversion in any Klaviyo account integrated with an
   * ecommerce platform. Klaviyo's `/api/metrics` doesn't expose a
   * `name` filter, so we have to scan client-side. Workspaces tend to
   * have well under a hundred metrics, so this is one paginated GET.
   * The resolved id is cached for the lifetime of this client.
   */
  async resolveConversionMetricId(): Promise<string> {
    if (this.conversionMetricId) return this.conversionMetricId;

    const metrics = await this.listMetrics();

    // Try the most likely names in priority order. First match wins.
    const candidates = [
      "Placed Order",
      "Ordered Product",
      "Started Checkout",
      "Active on Site",
    ];
    for (const name of candidates) {
      const match = metrics.find((m) => m.name === name);
      if (match) {
        this.conversionMetricId = match.id;
        return match.id;
      }
    }

    const visible = metrics
      .slice(0, 20)
      .map((m) => `  • ${m.name}${m.integration ? ` (${m.integration})` : ""}: ${m.id}`)
      .join("\n");
    throw new KlaviyoConfigError(
      `Could not auto-discover a conversion metric. Tried: ${candidates.join(", ")}.\n\n` +
        `Available metrics in this workspace${
          metrics.length > 20 ? ` (first 20 of ${metrics.length})` : ""
        }:\n${visible}\n\n` +
        `Set KLAVIYO_CONVERSION_METRIC_ID in .env.local to one of the ids above ` +
        `(or run \`npm run report:klaviyo -- --list-metrics\` to see the full list).`,
    );
  }

  /**
   * Fetches per-campaign aggregate statistics. Klaviyo's campaign-values-
   * reports endpoint accepts a list of campaign ids and statistic keys,
   * and returns one row per campaign.
   *
   * Stats requested: opens, opens_unique, clicks, clicks_unique,
   * conversions, conversion_value, recipients.
   */
  async getCampaignValues(
    campaignIds: string[],
    window: MetricWindow,
  ): Promise<CampaignStatistics[]> {
    if (campaignIds.length === 0) return [];

    const conversionMetricId = await this.resolveConversionMetricId();

    const body = {
      data: {
        type: "campaign-values-report",
        attributes: {
          // Pull Klaviyo's pre-computed rates alongside the raw counts.
          // Klaviyo's UI uses these (denominator is `delivered`, not
          // `recipients`) so the numbers in our report match what the
          // operator sees in the Klaviyo dashboard. We still request
          // the raw counts so we can show recipient size + total
          // revenue without re-deriving them.
          statistics: [
            "opens",
            "opens_unique",
            "open_rate",
            "clicks",
            "clicks_unique",
            "click_rate",
            "conversions",
            "conversion_value",
            "conversion_rate",
            "recipients",
            "delivered",
            "revenue_per_recipient",
          ],
          timeframe: {
            start: window.start.toISOString(),
            end: window.end.toISOString(),
          },
          filter: `contains-any(campaign_id,[${campaignIds.map((id) => `"${id}"`).join(",")}])`,
          conversion_metric_id: conversionMetricId,
        },
      },
    };

    const response = await this.request<CampaignValuesResponse>(
      `/api/campaign-values-reports`,
      { method: "POST", body: JSON.stringify(body) },
    );

    return (response.data?.attributes?.results ?? []).map(toCampaignStatistics);
  }
}

interface MetricsResponse {
  data?: Array<{
    id: string;
    attributes?: {
      name?: string;
      integration?: { name?: string };
    };
  }>;
  links?: { next?: string };
}

function toCampaignStatistics(row: CampaignValuesResultRow): CampaignStatistics {
  const stats = row.statistics ?? {};
  const recipients = stats.recipients ?? 0;
  const opensUnique = stats.opens_unique ?? 0;
  const clicksUnique = stats.clicks_unique ?? 0;
  const conversions = stats.conversions ?? 0;
  return {
    campaignId: row.groupings?.campaign_id ?? "",
    opens: stats.opens ?? 0,
    opensUnique,
    recipients,
    // Prefer Klaviyo's pre-computed rate (matches the dashboard).
    // Fall back to a raw-count derivation if the field is missing.
    openRate:
      stats.open_rate ?? (recipients > 0 ? opensUnique / recipients : 0),
    clicks: stats.clicks ?? 0,
    clicksUnique,
    clickRate:
      stats.click_rate ?? (recipients > 0 ? clicksUnique / recipients : 0),
    conversions,
    conversionRate:
      stats.conversion_rate ?? (recipients > 0 ? conversions / recipients : 0),
    revenue: stats.conversion_value ?? 0,
  };
}

function pickSubjectFromIncluded(
  row: CampaignsResultRow,
  included: ReadonlyArray<{
    type: string;
    id: string;
    attributes?: { definition?: { content?: { subject?: string } } };
  }>,
): string {
  const messageRefs =
    row.relationships?.["campaign-messages"]?.data ?? [];
  for (const ref of messageRefs) {
    const message = included.find(
      (i) => i.type === "campaign-message" && i.id === ref.id,
    );
    const subject = message?.attributes?.definition?.content?.subject;
    if (subject) return subject;
  }
  return "";
}

function extractCursor(nextLink: string | undefined): string | null {
  if (!nextLink) return null;
  try {
    const url = new URL(nextLink);
    return url.searchParams.get("page[cursor]");
  } catch {
    return null;
  }
}

// ─── Wire-format types (private to this file) ─────────────────────────

interface CampaignsResultRow {
  id: string;
  attributes: {
    name: string;
    status: string;
    send_time?: string | null;
  };
  relationships?: {
    "campaign-messages"?: {
      data?: Array<{ type: string; id: string }>;
    };
  };
}

interface KlaviyoCampaignsResponse {
  data: CampaignsResultRow[];
  included?: Array<{
    type: string;
    id: string;
    attributes?: { definition?: { content?: { subject?: string } } };
  }>;
  links?: { next?: string };
}

interface CampaignValuesResultRow {
  groupings?: { campaign_id?: string };
  statistics?: {
    opens?: number;
    opens_unique?: number;
    open_rate?: number;
    clicks?: number;
    clicks_unique?: number;
    click_rate?: number;
    conversions?: number;
    conversion_value?: number;
    conversion_rate?: number;
    recipients?: number;
    delivered?: number;
    revenue_per_recipient?: number;
  };
}

interface CampaignValuesResponse {
  data?: {
    attributes?: {
      results?: CampaignValuesResultRow[];
    };
  };
}
