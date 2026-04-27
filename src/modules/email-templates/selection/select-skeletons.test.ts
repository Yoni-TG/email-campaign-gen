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
  it("returns all candidates with null rationale when pool size ≤ 3", async () => {
    loadAllSpy.mockReturnValue([
      makeSkeleton("a", ["product_launch"]),
      makeSkeleton("b", ["product_launch"]),
      makeSkeleton("c", ["product_launch"]),
      makeSkeleton("x", ["editorial"]),
    ] as SkeletonManifest[]);

    const result = await selectModule.selectSkeletons({ campaignType: "product_launch" });

    expect(result).toHaveLength(3);
    expect(result.map((r) => r.skeleton.id)).toEqual(["a", "b", "c"]);
    expect(result.every((r) => r.rationale === null)).toBe(true);
    expect(rankSpy).not.toHaveBeenCalled();
  });

  it("hands the candidate pool to the ranker when pool size > 3", async () => {
    const pool = [
      makeSkeleton("a", ["product_launch"]),
      makeSkeleton("b", ["product_launch"]),
      makeSkeleton("c", ["product_launch"]),
      makeSkeleton("d", ["product_launch"]),
    ];
    loadAllSpy.mockReturnValue(pool as SkeletonManifest[]);

    rankSpy.mockResolvedValue([
      { skeleton: pool[1], rationale: "Editorial fits" },
      { skeleton: pool[2], rationale: "Story-led suits the brief" },
      { skeleton: pool[3], rationale: "Wide grid for the capsule" },
    ]);

    const input = { campaignType: "product_launch" as const, productCount: 4 };
    const result = await selectModule.selectSkeletons(input);

    expect(rankSpy).toHaveBeenCalledTimes(1);
    expect(rankSpy).toHaveBeenCalledWith(input, pool);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.skeleton.id)).toEqual(["b", "c", "d"]);
    expect(result[0]?.rationale).toBe("Editorial fits");
  });

  it("returns an empty array when no skeleton matches the campaign type", async () => {
    loadAllSpy.mockReturnValue([
      makeSkeleton("x", ["editorial"]),
    ] as SkeletonManifest[]);

    const result = await selectModule.selectSkeletons({ campaignType: "sale_promo" });

    expect(result).toEqual([]);
    expect(rankSpy).not.toHaveBeenCalled();
  });

  it("never calls the ranker when v1 ships exactly 3 per type", async () => {
    // Sanity assertion against the bundled skeleton library shape.
    const realLoad = await vi.importActual<SkeletonsModule>("../skeletons");
    loadAllSpy.mockReturnValue(realLoad.loadAllSkeletons());

    for (const type of [
      "product_launch",
      "sale_promo",
      "editorial",
      "collection_spotlight",
      "holiday_seasonal",
    ] as const) {
      const result = await selectModule.selectSkeletons({ campaignType: type });
      expect(result).toHaveLength(3);
    }
    expect(rankSpy).not.toHaveBeenCalled();
  });
});
