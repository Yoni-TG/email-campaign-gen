import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SkeletonManifest } from "../types";

// Each test resets module mocks so vi.doMock takes effect on the fresh import.
type SelectionModule = typeof import("./select-skeletons");
type RankerModule = typeof import("./llm-ranker");
type SkeletonsModule = typeof import("../skeletons");

let selectModule: SelectionModule;
let rankSpy: ReturnType<typeof vi.fn>;
let loadAllSpy: ReturnType<typeof vi.fn>;

function makeSkeleton(id: string, types: SkeletonManifest["campaignTypes"]): SkeletonManifest {
  return {
    id,
    name: id,
    campaignTypes: types,
    tags: [],
    description: "",
    requiredAssets: [],
    blocks: [],
  };
}

beforeEach(async () => {
  vi.resetModules();

  rankSpy = vi.fn();
  loadAllSpy = vi.fn();

  vi.doMock("./llm-ranker", () => ({ rankWithLLM: rankSpy }));
  vi.doMock("../skeletons", () => ({
    loadAllSkeletons: loadAllSpy,
    loadSkeletonById: vi.fn(),
  }));

  selectModule = await import("./select-skeletons");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock("./llm-ranker");
  vi.doUnmock("../skeletons");
});

describe("selectSkeletons", () => {
  it("hands the FULL pool to the ranker — no campaign-type pre-filter", async () => {
    // Mixed-type pool: 2 product_launch, 1 editorial, 1 sale_promo. Old
    // behaviour pre-filtered to 2 product_launch and skipped the ranker;
    // new behaviour sends all 4 to the ranker on every call.
    const pool = [
      makeSkeleton("a", ["product_launch"]),
      makeSkeleton("b", ["product_launch"]),
      makeSkeleton("c", ["editorial"]),
      makeSkeleton("d", ["sale_promo"]),
    ];
    loadAllSpy.mockReturnValue(pool as SkeletonManifest[]);

    rankSpy.mockResolvedValue([
      { skeleton: pool[0], rationale: "in-type fit" },
      { skeleton: pool[1], rationale: "in-type fit 2" },
      { skeleton: pool[2], rationale: "off-type wildcard for the warm voice" },
    ]);

    const input = { campaignType: "product_launch" as const, productCount: 4 };
    const result = await selectModule.selectSkeletons(input);

    expect(rankSpy).toHaveBeenCalledTimes(1);
    // Critical: the ranker received the WHOLE pool, not a filtered subset.
    const [arg0, arg1] = rankSpy.mock.calls[0] ?? [];
    expect(arg0).toEqual(input);
    expect(arg1).toBe(pool);
    expect(result.map((r) => r.skeleton.id)).toEqual(["a", "b", "c"]);
  });

  it("propagates off-type wildcard picks from the ranker", async () => {
    const pool = [
      makeSkeleton("editorial-x", ["editorial"]),
      makeSkeleton("sale-a", ["sale_promo"]),
      makeSkeleton("sale-b", ["sale_promo"]),
      makeSkeleton("sale-c", ["sale_promo"]),
    ];
    loadAllSpy.mockReturnValue(pool as SkeletonManifest[]);

    // Ranker promotes the editorial skeleton onto a sale_promo brief —
    // that's the new affordance, and selectSkeletons must not discard it.
    rankSpy.mockResolvedValue([
      { skeleton: pool[1], rationale: "in-type" },
      { skeleton: pool[2], rationale: "in-type" },
      { skeleton: pool[0], rationale: "wildcard — story-led fits the brief voice" },
    ]);

    const result = await selectModule.selectSkeletons({
      campaignType: "sale_promo",
    });

    expect(result.map((r) => r.skeleton.id)).toEqual([
      "sale-a",
      "sale-b",
      "editorial-x",
    ]);
    expect(result[2]?.rationale).toMatch(/wildcard/);
  });

  it("skips the ranker only when the bundled library has ≤ 3 manifests (defensive)", async () => {
    loadAllSpy.mockReturnValue([
      makeSkeleton("a", ["product_launch"]),
      makeSkeleton("b", ["editorial"]),
      makeSkeleton("c", ["sale_promo"]),
    ] as SkeletonManifest[]);

    const result = await selectModule.selectSkeletons({
      campaignType: "product_launch",
    });

    expect(result).toHaveLength(3);
    expect(rankSpy).not.toHaveBeenCalled();
    expect(result.every((r) => r.rationale === null)).toBe(true);
  });

  it("calls the ranker for every campaign type when the bundled library has > 3 manifests", async () => {
    const realLoad = await vi.importActual<SkeletonsModule>("../skeletons");
    const all = realLoad.loadAllSkeletons();
    loadAllSpy.mockReturnValue(all);

    rankSpy.mockResolvedValue([
      { skeleton: all[0], rationale: "x" },
      { skeleton: all[1], rationale: "y" },
      { skeleton: all[2], rationale: "z" },
    ]);

    for (const type of [
      "product_launch",
      "sale_promo",
      "editorial",
      "collection_spotlight",
      "holiday_seasonal",
    ] as const) {
      await selectModule.selectSkeletons({ campaignType: type });
    }
    expect(rankSpy).toHaveBeenCalledTimes(5);
    // Every call received the same full pool as the second positional arg.
    for (const call of rankSpy.mock.calls) {
      expect(call[1]).toBe(all);
    }
  });
});
