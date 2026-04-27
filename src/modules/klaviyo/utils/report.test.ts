import { describe, it, expect } from "vitest";
import type {
  CampaignStatistics,
  KlaviyoCampaign,
  MetricWindow,
} from "@/modules/klaviyo/types";
import { buildReport } from "./report";

const WINDOW: MetricWindow = {
  start: new Date("2026-01-27T00:00:00Z"),
  end: new Date("2026-04-27T00:00:00Z"),
};

function campaign(
  id: string,
  subject: string,
  sentAt: string,
): KlaviyoCampaign {
  return {
    id,
    name: subject,
    subject,
    channel: "email",
    sentAt,
    status: "Sent",
  };
}

function stat(
  campaignId: string,
  recipients: number,
  rates: {
    openRate: number;
    clickRate?: number;
    conversionRate?: number;
    revenue?: number;
    delivered?: number;
    revenuePerRecipient?: number;
  },
): CampaignStatistics {
  const delivered = rates.delivered ?? recipients;
  const revenue = rates.revenue ?? 0;
  return {
    campaignId,
    opens: 0,
    opensUnique: 0,
    recipients,
    delivered,
    openRate: rates.openRate,
    clicks: 0,
    clicksUnique: 0,
    clickRate: rates.clickRate ?? 0,
    conversions: 0,
    conversionRate: rates.conversionRate ?? 0,
    revenue,
    revenuePerRecipient:
      rates.revenuePerRecipient ?? (recipients > 0 ? revenue / recipients : 0),
  };
}

describe("buildReport", () => {
  it("ranks top-N by each metric and bottom-N by open rate", () => {
    const campaigns = [
      campaign("a", "Subject A", "2026-04-01T12:00:00Z"),
      campaign("b", "Subject B", "2026-04-05T12:00:00Z"),
      campaign("c", "Subject C", "2026-04-10T12:00:00Z"),
      campaign("d", "Subject D", "2026-04-15T12:00:00Z"),
    ];
    const stats = [
      stat("a", 1000, { openRate: 0.5, clickRate: 0.1, revenue: 100 }),
      stat("b", 1000, { openRate: 0.3, clickRate: 0.2, revenue: 500 }),
      stat("c", 1000, { openRate: 0.4, clickRate: 0.15, revenue: 250 }),
      stat("d", 1000, { openRate: 0.2, clickRate: 0.05, revenue: 50 }),
    ];

    const report = buildReport(campaigns, stats, WINDOW, {
      topN: 2,
      bottomN: 2,
    });

    expect(report.topByOpenRate.map((r) => r.id)).toEqual(["a", "c"]);
    expect(report.topByClickRate.map((r) => r.id)).toEqual(["b", "c"]);
    expect(report.topByRevenue.map((r) => r.id)).toEqual(["b", "c"]);
    expect(report.topByRevenuePerRecipient.map((r) => r.id)).toEqual(["b", "c"]);
    expect(report.bottomByOpenRate.map((r) => r.id)).toEqual(["d", "b"]);
  });

  it("computes bounceRate and revenuePerRecipient on each row", () => {
    const campaigns = [campaign("a", "Subject A", "2026-04-01T12:00:00Z")];
    const stats = [
      stat("a", 1000, {
        openRate: 0.5,
        delivered: 990,
        revenue: 100,
      }),
    ];

    const [row] = buildReport(campaigns, stats, WINDOW).all;
    expect(row.delivered).toBe(990);
    expect(row.bounceRate).toBeCloseTo(0.01);
    expect(row.revenuePerRecipient).toBeCloseTo(0.1);
  });

  it("excludes campaigns below minRecipients from rankings but keeps them in `all`", () => {
    const campaigns = [
      campaign("big", "Big send", "2026-04-01T12:00:00Z"),
      campaign("tiny", "Tiny send with crazy rate", "2026-04-05T12:00:00Z"),
    ];
    const stats = [
      stat("big", 5000, { openRate: 0.4 }),
      stat("tiny", 30, { openRate: 1.0 }),
    ];

    const report = buildReport(campaigns, stats, WINDOW, {
      minRecipients: 100,
    });

    expect(report.all.map((r) => r.id).sort()).toEqual(["big", "tiny"]);
    expect(report.topByOpenRate.map((r) => r.id)).toEqual(["big"]);
    expect(report.summary.meanOpenRate).toBe(0.4);
  });

  it("drops campaigns without matching stats", () => {
    const campaigns = [
      campaign("a", "Subject A", "2026-04-01T12:00:00Z"),
      campaign("missing", "Never sent stats", "2026-04-02T12:00:00Z"),
    ];
    const stats = [stat("a", 1000, { openRate: 0.4 })];

    const report = buildReport(campaigns, stats, WINDOW);
    expect(report.all.map((r) => r.id)).toEqual(["a"]);
    expect(report.summary.totalCampaigns).toBe(2);
    expect(report.summary.campaignsWithStats).toBe(1);
  });

  it("computes summary stats over the rankable set", () => {
    const campaigns = [
      campaign("a", "A", "2026-04-01T12:00:00Z"),
      campaign("b", "B", "2026-04-05T12:00:00Z"),
      campaign("c", "C", "2026-04-10T12:00:00Z"),
    ];
    const stats = [
      stat("a", 2000, { openRate: 0.5, revenue: 1000 }),
      stat("b", 1000, { openRate: 0.3, revenue: 500 }),
      stat("c", 4000, { openRate: 0.4, revenue: 2000 }),
    ];

    const { summary } = buildReport(campaigns, stats, WINDOW);
    expect(summary.meanOpenRate).toBeCloseTo(0.4);
    expect(summary.medianOpenRate).toBeCloseTo(0.4);
    expect(summary.totalRevenue).toBe(3500);
    expect(summary.totalRecipients).toBe(7000);
  });

  it("sorts `all` by sentAt desc; nulls last", () => {
    const campaigns = [
      campaign("old", "Old", "2026-02-01T12:00:00Z"),
      campaign("recent", "Recent", "2026-04-15T12:00:00Z"),
      { ...campaign("nodate", "No send time", "2026-01-01T00:00:00Z"), sentAt: null },
    ];
    const stats = [
      stat("old", 1000, { openRate: 0.3 }),
      stat("recent", 1000, { openRate: 0.4 }),
      stat("nodate", 1000, { openRate: 0.5 }),
    ];

    const report = buildReport(campaigns, stats, WINDOW);
    expect(report.all.map((r) => r.id)).toEqual(["recent", "old", "nodate"]);
  });
});
