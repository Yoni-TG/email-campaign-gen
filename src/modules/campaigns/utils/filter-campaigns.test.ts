import { describe, expect, it } from "vitest";
import type { CampaignSummary } from "./campaign-persistence";
import {
  DEFAULT_FILTERS,
  filterCampaigns,
  groupByMonth,
} from "./filter-campaigns";

function summary(overrides: Partial<CampaignSummary>): CampaignSummary {
  return {
    id: "id",
    name: "Test",
    status: "draft",
    campaignType: "product_launch",
    createdBy: "team",
    createdAt: new Date("2026-04-15T10:00:00Z"),
    updatedAt: new Date("2026-04-15T10:00:00Z"),
    archivedAt: null,
    ...overrides,
  };
}

describe("filterCampaigns", () => {
  const a = summary({
    id: "a",
    name: "Spring sale",
    campaignType: "sale_promo",
    status: "completed",
    createdAt: new Date("2026-04-15T10:00:00Z"),
  });
  const b = summary({
    id: "b",
    name: "Mother's Day",
    campaignType: "holiday_seasonal",
    status: "review",
    createdAt: new Date("2026-04-20T10:00:00Z"),
  });
  const c = summary({
    id: "c",
    name: "Spring launch",
    campaignType: "product_launch",
    status: "draft",
    createdAt: new Date("2026-03-01T10:00:00Z"),
  });
  const all = [a, b, c];

  it("returns input order when no filters and newest sort", () => {
    const out = filterCampaigns(all, DEFAULT_FILTERS);
    expect(out.map((c) => c.id)).toEqual(["b", "a", "c"]);
  });

  it("matches search by case-insensitive substring", () => {
    const out = filterCampaigns(all, { ...DEFAULT_FILTERS, search: "spring" });
    expect(out.map((c) => c.id).sort()).toEqual(["a", "c"]);
  });

  it("filters by type", () => {
    const out = filterCampaigns(all, {
      ...DEFAULT_FILTERS,
      type: "product_launch",
    });
    expect(out.map((c) => c.id)).toEqual(["c"]);
  });

  it("filters by status", () => {
    const out = filterCampaigns(all, {
      ...DEFAULT_FILTERS,
      status: "completed",
    });
    expect(out.map((c) => c.id)).toEqual(["a"]);
  });

  it("sorts by oldest", () => {
    const out = filterCampaigns(all, { ...DEFAULT_FILTERS, sort: "oldest" });
    expect(out.map((c) => c.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts by name (case-insensitive)", () => {
    const out = filterCampaigns(all, { ...DEFAULT_FILTERS, sort: "name" });
    expect(out.map((c) => c.id)).toEqual(["b", "c", "a"]);
  });

  it("combines filters", () => {
    const out = filterCampaigns(all, {
      ...DEFAULT_FILTERS,
      search: "spring",
      type: "product_launch",
    });
    expect(out.map((c) => c.id)).toEqual(["c"]);
  });
});

describe("groupByMonth", () => {
  it("groups by year-month preserving input order", () => {
    const a = summary({ id: "a", createdAt: new Date("2026-04-20T00:00:00Z") });
    const b = summary({ id: "b", createdAt: new Date("2026-04-01T00:00:00Z") });
    const c = summary({ id: "c", createdAt: new Date("2026-03-15T00:00:00Z") });

    const groups = groupByMonth([a, b, c]);
    expect(groups.map((g) => g.key)).toEqual(["2026-04", "2026-03"]);
    expect(groups[0].campaigns.map((c) => c.id)).toEqual(["a", "b"]);
    expect(groups[1].campaigns.map((c) => c.id)).toEqual(["c"]);
  });

  it("returns empty array for empty input", () => {
    expect(groupByMonth([])).toEqual([]);
  });
});
