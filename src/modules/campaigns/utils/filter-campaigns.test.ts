import { describe, expect, it } from "vitest";
import type { CampaignSummary } from "./campaign-persistence";
import {
  bucketIncludesStatus,
  countByBucket,
  DEFAULT_FILTERS,
  filterCampaigns,
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
    teaser: "",
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
  const d = summary({
    id: "d",
    name: "Editorial — Layering Guide",
    campaignType: "editorial",
    status: "rendering_candidates",
    createdAt: new Date("2026-04-22T10:00:00Z"),
  });
  const all = [a, b, c, d];

  it("returns input order when no filters and newest sort", () => {
    const out = filterCampaigns(all, DEFAULT_FILTERS);
    expect(out.map((c) => c.id)).toEqual(["d", "b", "a", "c"]);
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

  it("filters by bucket (drafts)", () => {
    const out = filterCampaigns(all, { ...DEFAULT_FILTERS, bucket: "drafts" });
    expect(out.map((c) => c.id)).toEqual(["c"]);
  });

  it("filters by bucket (completed)", () => {
    const out = filterCampaigns(all, {
      ...DEFAULT_FILTERS,
      bucket: "completed",
    });
    expect(out.map((c) => c.id)).toEqual(["a"]);
  });

  it("filters by bucket (in_progress) rolling up the intermediate render states", () => {
    const out = filterCampaigns(all, {
      ...DEFAULT_FILTERS,
      bucket: "in_progress",
    });
    expect(out.map((c) => c.id)).toEqual(["d"]);
  });

  it("sorts by oldest", () => {
    const out = filterCampaigns(all, { ...DEFAULT_FILTERS, sort: "oldest" });
    expect(out.map((c) => c.id)).toEqual(["c", "a", "b", "d"]);
  });

  it("sorts by name (case-insensitive)", () => {
    const out = filterCampaigns(all, { ...DEFAULT_FILTERS, sort: "name" });
    expect(out.map((c) => c.id)).toEqual(["d", "b", "c", "a"]);
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

describe("bucketIncludesStatus", () => {
  it("treats 'all' as a wildcard", () => {
    expect(bucketIncludesStatus("all", "draft")).toBe(true);
    expect(bucketIncludesStatus("all", "completed")).toBe(true);
  });

  it("matches a single-status bucket exactly", () => {
    expect(bucketIncludesStatus("review", "review")).toBe(true);
    expect(bucketIncludesStatus("review", "draft")).toBe(false);
  });

  it("rolls up intermediate render states under in_progress", () => {
    expect(bucketIncludesStatus("in_progress", "rendering_candidates")).toBe(
      true,
    );
    expect(bucketIncludesStatus("in_progress", "asset_upload")).toBe(true);
    expect(bucketIncludesStatus("in_progress", "draft")).toBe(false);
    expect(bucketIncludesStatus("in_progress", "completed")).toBe(false);
  });
});

describe("countByBucket", () => {
  it("totals into 'all' and rolls intermediates into 'in_progress'", () => {
    const xs = [
      summary({ id: "1", status: "draft" }),
      summary({ id: "2", status: "review" }),
      summary({ id: "3", status: "rendering_candidates" }),
      summary({ id: "4", status: "asset_upload" }),
      summary({ id: "5", status: "completed" }),
      summary({ id: "6", status: "completed" }),
    ];
    expect(countByBucket(xs)).toEqual({
      all: 6,
      drafts: 1,
      review: 1,
      in_progress: 2,
      completed: 2,
    });
  });

  it("zeros every bucket on empty input", () => {
    expect(countByBucket([])).toEqual({
      all: 0,
      drafts: 0,
      review: 0,
      in_progress: 0,
      completed: 0,
    });
  });
});
