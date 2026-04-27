import { describe, it, expect } from "vitest";
import type { CampaignType } from "@/lib/types";
import type {
  CampaignStatistics,
  KlaviyoCampaign,
} from "@/modules/klaviyo/types";
import { __testing } from "./metric-sync";

const { inferCampaignType, buildSubjectScopes } = __testing;

function campaign(
  overrides: Partial<KlaviyoCampaign> = {},
): KlaviyoCampaign {
  return {
    id: "c1",
    name: "Default",
    subject: "Default subject",
    channel: "email",
    sentAt: "2026-04-01T12:00:00Z",
    status: "Sent",
    ...overrides,
  };
}

function stats(
  campaignId: string,
  openRate: number,
): CampaignStatistics {
  return {
    campaignId,
    opens: 0,
    opensUnique: 0,
    recipients: 1000,
    openRate,
    clicks: 0,
    clicksUnique: 0,
    clickRate: 0,
    conversions: 0,
    conversionRate: 0,
    revenue: 0,
  };
}

describe("inferCampaignType", () => {
  it.each<[string, CampaignType]>([
    ["20% off everything!", "sale_promo"],
    ["Now Launching: the Heart capsule", "product_launch"],
    ["Mother's Day gift guide", "holiday_seasonal"],
    ["Inside the Hearts collection", "collection_spotlight"],
    ["A note from Theo", "editorial"],
  ])("classifies %j as %s", (subject, expected) => {
    expect(inferCampaignType(campaign({ subject, name: subject }))).toBe(
      expected,
    );
  });

  it("returns null for empty input", () => {
    expect(inferCampaignType(campaign({ subject: "", name: "" }))).toBeNull();
  });
});

describe("buildSubjectScopes", () => {
  it("buckets by inferred type, sorts by open rate desc, takes top 3", () => {
    const campaigns: KlaviyoCampaign[] = [
      campaign({ id: "a", subject: "20% off necklaces" }),
      campaign({ id: "b", subject: "30% off rings" }),
      campaign({ id: "c", subject: "40% off bracelets" }),
      campaign({ id: "d", subject: "10% off earrings" }),
    ];
    const statRows: CampaignStatistics[] = [
      stats("a", 0.32),
      stats("b", 0.41),
      stats("c", 0.28),
      stats("d", 0.5),
    ];

    const out = buildSubjectScopes(campaigns, statRows, inferCampaignType);

    expect(out).toHaveLength(1);
    const [bucket] = out;
    expect(bucket.scope).toBe("subject:sale_promo");
    expect(bucket.metrics.map((m) => m.openRate)).toEqual([0.5, 0.41, 0.32]);
    expect(bucket.metrics.every((m) => m.campaignType === "sale_promo")).toBe(
      true,
    );
  });

  it("drops campaigns missing stats, subject, or sentAt", () => {
    const campaigns: KlaviyoCampaign[] = [
      campaign({ id: "a", subject: "" }),
      campaign({ id: "b", sentAt: null }),
      campaign({ id: "c", subject: "20% off everything" }),
    ];
    const statRows: CampaignStatistics[] = [
      stats("a", 0.5),
      stats("b", 0.4),
      stats("c", 0.3),
    ];

    const out = buildSubjectScopes(campaigns, statRows, inferCampaignType);
    expect(out).toEqual([
      {
        scope: "subject:sale_promo",
        metrics: [
          {
            campaignType: "sale_promo",
            subject: "20% off everything",
            openRate: 0.3,
            sentAt: "2026-04-01T12:00:00Z",
          },
        ],
      },
    ]);
  });

  it("returns empty when no campaigns classify", () => {
    const out = buildSubjectScopes([], [], inferCampaignType);
    expect(out).toEqual([]);
  });
});
