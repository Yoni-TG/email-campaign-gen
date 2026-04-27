import { describe, it, expect } from "vitest";
import type {
  CampaignStatistics,
  KlaviyoCampaign,
  MetricWindow,
} from "@/modules/klaviyo/types";
import { buildReport, extractWinners, stripLiquid } from "./report";

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

describe("stripLiquid", () => {
  it("removes {{ }} expressions", () => {
    expect(stripLiquid("Hi {{ first_name|capitalize }}, ready?")).toBe(
      "Hi ready?",
    );
  });

  it("removes {% %} blocks", () => {
    expect(
      stripLiquid("{% if first_name %}{{ first_name }}, {% endif %}Are You In?"),
    ).toBe("Are You In?");
  });

  it("collapses extra whitespace and strips a leading orphan comma", () => {
    expect(stripLiquid("{{ first_name }}, hi   there")).toBe("hi there");
  });

  it("leaves clean strings alone", () => {
    expect(stripLiquid("Last Day for Free Mother's Day Shipping + 25% OFF 💙"))
      .toBe("Last Day for Free Mother's Day Shipping + 25% OFF 💙");
  });
});

describe("extractWinners", () => {
  function row(
    overrides: Partial<{
      id: string;
      subject: string;
      recipients: number;
      bounceRate: number;
      revenuePerRecipient: number;
      sentAt: string | null;
    }> = {},
  ) {
    const stat = {
      campaignId: overrides.id ?? "x",
      opens: 0,
      opensUnique: 0,
      recipients: overrides.recipients ?? 100_000,
      delivered: Math.floor(
        (overrides.recipients ?? 100_000) * (1 - (overrides.bounceRate ?? 0)),
      ),
      openRate: 0.5,
      clicks: 0,
      clicksUnique: 0,
      clickRate: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      revenuePerRecipient: overrides.revenuePerRecipient ?? 0.01,
    };
    const c: KlaviyoCampaign = {
      id: overrides.id ?? "x",
      name: overrides.subject ?? "X",
      subject: overrides.subject ?? "X",
      channel: "email",
      sentAt: overrides.sentAt ?? "2026-04-01T12:00:00Z",
      status: "Sent",
    };
    return { campaign: c, stat };
  }

  it("filters by minRecipients, sorts by $/recipient desc, takes top N, strips liquid", () => {
    const fixtures = [
      row({ id: "a", subject: "{{ first_name }}, last call!", recipients: 200_000, revenuePerRecipient: 0.05 }),
      row({ id: "tiny", subject: "Tiny send big rate", recipients: 1_000, revenuePerRecipient: 1.0 }),
      row({ id: "b", subject: "Mother's Day 💙", recipients: 300_000, revenuePerRecipient: 0.04 }),
      row({ id: "c", subject: "Earth Day 30% Off", recipients: 250_000, revenuePerRecipient: 0.02 }),
    ];

    const report = buildReport(
      fixtures.map((f) => f.campaign),
      fixtures.map((f) => f.stat) as CampaignStatistics[],
      WINDOW,
      { minRecipients: 100 },
    );
    const winners = extractWinners(report.all, { minRecipients: 50_000, topN: 2 });

    expect(winners).toHaveLength(2);
    expect(winners[0].subject).toBe("last call!");
    expect(winners[1].subject).toBe("Mother's Day 💙");
  });

  it("drops sends with too-high bounce rate", () => {
    const fixtures = [
      row({ id: "good", subject: "Clean", recipients: 100_000, bounceRate: 0.005, revenuePerRecipient: 0.01 }),
      row({ id: "bouncy", subject: "Junk list", recipients: 100_000, bounceRate: 0.05, revenuePerRecipient: 1.0 }),
    ];
    const report = buildReport(
      fixtures.map((f) => f.campaign),
      fixtures.map((f) => f.stat) as CampaignStatistics[],
      WINDOW,
    );
    const winners = extractWinners(report.all);
    expect(winners.map((w) => w.subject)).toEqual(["Clean"]);
  });

  it("drops winners whose subject becomes empty after stripping liquid", () => {
    const fixtures = [
      row({ id: "only_liquid", subject: "{{ first_name }}", recipients: 100_000, revenuePerRecipient: 0.5 }),
      row({ id: "real", subject: "Real subject", recipients: 100_000, revenuePerRecipient: 0.1 }),
    ];
    const report = buildReport(
      fixtures.map((f) => f.campaign),
      fixtures.map((f) => f.stat) as CampaignStatistics[],
      WINDOW,
    );
    const winners = extractWinners(report.all);
    expect(winners.map((w) => w.subject)).toEqual(["Real subject"]);
  });
});
