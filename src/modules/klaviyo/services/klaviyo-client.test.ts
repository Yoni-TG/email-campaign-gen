import { describe, it, expect, vi } from "vitest";
import {
  KlaviyoApiError,
  KlaviyoClient,
  KlaviyoConfigError,
} from "./klaviyo-client";

const WINDOW = {
  start: new Date("2026-03-28T00:00:00Z"),
  end: new Date("2026-04-27T00:00:00Z"),
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/vnd.api+json" },
    ...init,
  });
}

describe("KlaviyoClient construction", () => {
  it("throws when no API key is provided", () => {
    const original = process.env.KLAVIYO_API_KEY;
    delete process.env.KLAVIYO_API_KEY;
    try {
      expect(() => new KlaviyoClient()).toThrow(KlaviyoConfigError);
    } finally {
      if (original !== undefined) process.env.KLAVIYO_API_KEY = original;
    }
  });

  it("uses the provided API key + revision", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ data: [], links: {} }),
    );
    const client = new KlaviyoClient({
      apiKey: "pk_test",
      revision: "2026-04-15",
      fetchImpl,
    });

    await client.listEmailCampaigns(WINDOW);

    const [, init] = fetchImpl.mock.calls[0];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Klaviyo-API-Key pk_test");
    expect(headers.get("revision")).toBe("2026-04-15");
  });
});

describe("listEmailCampaigns", () => {
  it("flattens paginated results and joins subject lines from included", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              id: "c1",
              attributes: {
                name: "Spring Drop",
                status: "Sent",
                send_time: "2026-04-01T12:00:00Z",
              },
              relationships: {
                "campaign-messages": { data: [{ type: "campaign-message", id: "m1" }] },
              },
            },
          ],
          included: [
            {
              type: "campaign-message",
              id: "m1",
              attributes: {
                definition: { content: { subject: "Fresh picks for spring" } },
              },
            },
          ],
          links: {
            next: "https://a.klaviyo.com/api/campaigns?page%5Bcursor%5D=NEXT",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: [
            {
              id: "c2",
              attributes: {
                name: "Easter",
                status: "Sent",
                send_time: "2026-04-12T12:00:00Z",
              },
              relationships: {
                "campaign-messages": { data: [{ type: "campaign-message", id: "m2" }] },
              },
            },
          ],
          included: [
            {
              type: "campaign-message",
              id: "m2",
              attributes: {
                definition: { content: { subject: "Easter gifts inside" } },
              },
            },
          ],
          links: {},
        }),
      );

    const client = new KlaviyoClient({ apiKey: "pk_test", fetchImpl });
    const out = await client.listEmailCampaigns(WINDOW);

    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      id: "c1",
      subject: "Fresh picks for spring",
      channel: "email",
    });
    expect(out[1].subject).toBe("Easter gifts inside");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("returns empty subject when no message is included", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: "c1",
            attributes: {
              name: "Mystery",
              status: "Sent",
              send_time: "2026-04-01T12:00:00Z",
            },
            relationships: { "campaign-messages": { data: [] } },
          },
        ],
        links: {},
      }),
    );
    const client = new KlaviyoClient({ apiKey: "pk_test", fetchImpl });
    const [row] = await client.listEmailCampaigns(WINDOW);
    expect(row.subject).toBe("");
  });

  it("surfaces non-2xx as KlaviyoApiError", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("rate limited", { status: 429 }),
    );
    const client = new KlaviyoClient({ apiKey: "pk_test", fetchImpl });
    await expect(client.listEmailCampaigns(WINDOW)).rejects.toBeInstanceOf(
      KlaviyoApiError,
    );
  });
});

describe("getCampaignValues", () => {
  it("returns [] without calling the API when no ids are provided", async () => {
    const fetchImpl = vi.fn();
    const client = new KlaviyoClient({
      apiKey: "pk_test",
      fetchImpl,
      conversionMetricId: "metric_placed_order",
    });
    const out = await client.getCampaignValues([], WINDOW);
    expect(out).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("auto-discovers Placed Order metric when no id is configured", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [{ id: "metric_auto_discovered", attributes: { name: "Placed Order" } }],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              attributes: {
                results: [
                  {
                    groupings: { campaign_id: "c1" },
                    statistics: { recipients: 100 },
                  },
                ],
              },
            },
          }),
          { status: 200 },
        ),
      );

    const client = new KlaviyoClient({ apiKey: "pk_test", fetchImpl });
    const out = await client.getCampaignValues(["c1"], WINDOW);
    expect(out).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const valuesBody = JSON.parse(fetchImpl.mock.calls[1][1].body);
    expect(valuesBody.data.attributes.conversion_metric_id).toBe(
      "metric_auto_discovered",
    );
  });

  it("throws KlaviyoConfigError when no Placed Order metric exists", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    const client = new KlaviyoClient({ apiKey: "pk_test", fetchImpl });
    await expect(client.getCampaignValues(["c1"], WINDOW)).rejects.toThrow(
      /Could not auto-discover/,
    );
  });

  it("prefers Klaviyo's pre-computed rates when present", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          attributes: {
            results: [
              {
                groupings: { campaign_id: "c1" },
                statistics: {
                  opens: 1200,
                  opens_unique: 1000,
                  open_rate: 0.21,
                  clicks: 200,
                  clicks_unique: 180,
                  click_rate: 0.04,
                  conversions: 40,
                  conversion_value: 4500,
                  conversion_rate: 0.009,
                  recipients: 5000,
                  delivered: 4900,
                  revenue_per_recipient: 0.92,
                },
              },
            ],
          },
        },
      }),
    );
    const client = new KlaviyoClient({
      apiKey: "pk_test",
      fetchImpl,
      conversionMetricId: "metric_placed_order",
    });
    const [stats] = await client.getCampaignValues(["c1"], WINDOW);

    expect(stats.campaignId).toBe("c1");
    expect(stats.openRate).toBe(0.21);
    expect(stats.clickRate).toBe(0.04);
    expect(stats.conversionRate).toBe(0.009);
    expect(stats.delivered).toBe(4900);
    expect(stats.revenue).toBe(4500);
    expect(stats.revenuePerRecipient).toBe(0.92);
  });

  it("falls back to raw-count derivation when pre-computed rates are missing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          attributes: {
            results: [
              {
                groupings: { campaign_id: "c1" },
                statistics: {
                  opens_unique: 1000,
                  clicks_unique: 180,
                  conversions: 40,
                  conversion_value: 4500,
                  recipients: 5000,
                },
              },
            ],
          },
        },
      }),
    );
    const client = new KlaviyoClient({
      apiKey: "pk_test",
      fetchImpl,
      conversionMetricId: "metric_placed_order",
    });
    const [stats] = await client.getCampaignValues(["c1"], WINDOW);

    expect(stats.delivered).toBe(5000); // falls back to recipients
    expect(stats.openRate).toBeCloseTo(0.2);
    expect(stats.clickRate).toBeCloseTo(0.036);
    expect(stats.conversionRate).toBeCloseTo(0.008);
    expect(stats.revenuePerRecipient).toBeCloseTo(0.9);
  });

  it("yields zero rates when recipients is 0 (avoids NaN)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          attributes: {
            results: [
              {
                groupings: { campaign_id: "c1" },
                statistics: { recipients: 0 },
              },
            ],
          },
        },
      }),
    );
    const client = new KlaviyoClient({
      apiKey: "pk_test",
      fetchImpl,
      conversionMetricId: "metric_placed_order",
    });
    const [stats] = await client.getCampaignValues(["c1"], WINDOW);
    expect(stats.openRate).toBe(0);
    expect(stats.clickRate).toBe(0);
    expect(stats.conversionRate).toBe(0);
    expect(stats.revenuePerRecipient).toBe(0);
  });
});
