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
}

export class KlaviyoClient {
  private readonly apiKey: string;
  private readonly revision: string;
  private readonly fetchImpl: typeof fetch;

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
   * Klaviyo's filter language requires a channel filter on campaigns.
   * We further constrain by `send_time` to the window.
   */
  async listEmailCampaigns(window: MetricWindow): Promise<KlaviyoCampaign[]> {
    const filter = [
      `equals(messages.channel,'email')`,
      `greater-or-equal(send_time,${window.start.toISOString()})`,
      `less-than(send_time,${window.end.toISOString()})`,
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

    const body = {
      data: {
        type: "campaign-values-report",
        attributes: {
          statistics: [
            "opens",
            "opens_unique",
            "clicks",
            "clicks_unique",
            "conversions",
            "conversion_value",
            "recipients",
          ],
          timeframe: {
            start: window.start.toISOString(),
            end: window.end.toISOString(),
          },
          filter: `any(campaign_id,[${campaignIds.map((id) => `"${id}"`).join(",")}])`,
          conversion_metric_id: process.env.KLAVIYO_CONVERSION_METRIC_ID,
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
    openRate: recipients > 0 ? opensUnique / recipients : 0,
    clicks: stats.clicks ?? 0,
    clicksUnique,
    clickRate: recipients > 0 ? clicksUnique / recipients : 0,
    conversions,
    conversionRate: recipients > 0 ? conversions / recipients : 0,
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
    clicks?: number;
    clicks_unique?: number;
    conversions?: number;
    conversion_value?: number;
    recipients?: number;
  };
}

interface CampaignValuesResponse {
  data?: {
    attributes?: {
      results?: CampaignValuesResultRow[];
    };
  };
}
