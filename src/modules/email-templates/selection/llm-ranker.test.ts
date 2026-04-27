import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SkeletonManifest } from "../types";

type RankerModule = typeof import("./llm-ranker");

let rankerModule: RankerModule;
let messagesCreate: ReturnType<typeof vi.fn>;

function makeSkeleton(id: string): SkeletonManifest {
  return {
    id,
    name: `Skeleton ${id}`,
    campaignTypes: ["product_launch"],
    tags: [],
    description: `Description for ${id}`,
    requiredAssets: [],
    blocks: [],
  };
}

beforeEach(async () => {
  vi.resetModules();

  messagesCreate = vi.fn();

  vi.doMock("@anthropic-ai/sdk", () => {
    class MockAnthropic {
      messages = { create: messagesCreate };
    }
    return { default: MockAnthropic };
  });

  rankerModule = await import("./llm-ranker");
});

describe("rankWithLLM", () => {
  it("returns ranked skeletons mapped from the tool-use response", async () => {
    const candidates = ["a", "b", "c", "d"].map(makeSkeleton);
    messagesCreate.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "rank_skeletons",
          input: {
            ranked: [
              { skeleton_id: "b", rationale: "Best fit for product count." },
              { skeleton_id: "d", rationale: "Image-led suits warm-hearted." },
              { skeleton_id: "a", rationale: "Default for product launch." },
            ],
          },
        },
      ],
    });

    const result = await rankerModule.rankWithLLM(
      { campaignType: "product_launch", productCount: 4 },
      candidates,
    );

    expect(result).toHaveLength(3);
    expect(result.map((r) => r.skeleton.id)).toEqual(["b", "d", "a"]);
    expect(result[0]?.rationale).toBe("Best fit for product count.");
  });

  it("calls Anthropic with the rank_skeletons tool and forced tool_choice", async () => {
    const candidates = ["a", "b", "c", "d"].map(makeSkeleton);
    messagesCreate.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "rank_skeletons",
          input: {
            ranked: [
              { skeleton_id: "a", rationale: "x" },
              { skeleton_id: "b", rationale: "y" },
              { skeleton_id: "c", rationale: "z" },
            ],
          },
        },
      ],
    });

    await rankerModule.rankWithLLM({ campaignType: "product_launch" }, candidates);

    const call = messagesCreate.mock.calls[0]?.[0];
    expect(call?.tool_choice).toEqual({ type: "tool", name: "rank_skeletons" });
    expect(call?.tools?.[0]?.name).toBe("rank_skeletons");
  });

  it("pads with unranked candidates when the LLM returns fewer than 3 valid ids", async () => {
    const candidates = ["a", "b", "c", "d"].map(makeSkeleton);
    messagesCreate.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "rank_skeletons",
          input: {
            ranked: [
              { skeleton_id: "a", rationale: "ok" },
              { skeleton_id: "totally-bogus-id", rationale: "ignored" },
              { skeleton_id: "totally-also-bogus", rationale: "ignored" },
            ],
          },
        },
      ],
    });

    const result = await rankerModule.rankWithLLM(
      { campaignType: "product_launch" },
      candidates,
    );

    expect(result).toHaveLength(3);
    expect(result[0]?.skeleton.id).toBe("a");
    expect(result[0]?.rationale).toBe("ok");
    // The padded picks come from the candidate pool (in registry order)
    // and have null rationale.
    expect(result.slice(1).every((r) => r.rationale === null)).toBe(true);
  });

  it("throws when Claude returns no tool_use block", async () => {
    messagesCreate.mockResolvedValue({
      content: [{ type: "text", text: "no tool used" }],
    });

    await expect(
      rankerModule.rankWithLLM(
        { campaignType: "product_launch" },
        ["a", "b", "c", "d"].map(makeSkeleton),
      ),
    ).rejects.toThrow(/no tool use response/i);
  });

  it("returns the candidate pool unchanged when given ≤ 3 candidates (defensive guard)", async () => {
    const candidates = ["a", "b", "c"].map(makeSkeleton);
    const result = await rankerModule.rankWithLLM(
      { campaignType: "product_launch" },
      candidates,
    );

    expect(result.map((r) => r.skeleton.id)).toEqual(["a", "b", "c"]);
    expect(result.every((r) => r.rationale === null)).toBe(true);
    expect(messagesCreate).not.toHaveBeenCalled();
  });
});
