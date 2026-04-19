import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreativeSeed, GeneratedCopy } from "@/lib/types";

const MOCK_COPY: GeneratedCopy = {
  subjectLines: [
    "Your next favorite piece is waiting",
    "Personalized, just for you",
    "Something special this way comes",
  ],
  preHeader: "Discover our latest collection",
  hero: {
    title: "Made for You",
    subtitle: "New Collection Drop",
    paragraph: "Explore pieces designed with you in mind.",
  },
  secondary: {
    title: "Trending Now",
    subtitle: "See what everyone's loving",
    ctaText: "Shop the Collection",
  },
  primaryCtaText: "Explore Now",
  smsCopy: "New drop just landed! Shop now: theograce.com",
};

type CopyGenerationModule = typeof import("@/modules/copy-generation/services/copy-generation");

let copyGeneration: CopyGenerationModule;
let messagesCreate: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules();

  messagesCreate = vi.fn().mockResolvedValue({
    content: [
      {
        type: "tool_use",
        name: "generate_campaign_copy",
        input: MOCK_COPY,
      },
    ],
  });

  vi.doMock("@anthropic-ai/sdk", () => {
    class MockAnthropic {
      messages = { create: messagesCreate };
    }
    return { default: MockAnthropic };
  });

  copyGeneration = await import(
    "@/modules/copy-generation/services/copy-generation"
  );
});

describe("generateCopy", () => {
  it("returns a GeneratedCopy matching the tool output", async () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Spring collection launch",
      includeSms: true,
    };
    const result = await copyGeneration.generateCopy(seed, "product_launch");

    expect(result.subjectLines).toHaveLength(3);
    expect(result.hero.title).toBeTruthy();
    expect(result.secondary.ctaText).toBeTruthy();
    expect(result.primaryCtaText).toBeTruthy();
  });

  it("includes SMS copy when seed.includeSms is true", async () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Spring",
      includeSms: true,
    };
    const result = await copyGeneration.generateCopy(seed, "product_launch");
    expect(result.smsCopy).toBeTruthy();
  });

  it("calls messages.create with generate_campaign_copy tool + cache_control on system", async () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Spring",
      includeSms: false,
    };
    await copyGeneration.generateCopy(seed, "product_launch");

    expect(messagesCreate).toHaveBeenCalledTimes(1);
    const call = messagesCreate.mock.calls[0][0];
    expect(call.tools[0].name).toBe("generate_campaign_copy");
    expect(call.tool_choice).toEqual({
      type: "tool",
      name: "generate_campaign_copy",
    });
    expect(Array.isArray(call.system)).toBe(true);
    expect(call.system[0].cache_control).toEqual({ type: "ephemeral" });
  });

  it("throws a descriptive error when the model response has no tool_use block", async () => {
    messagesCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "no tool call here" }],
    });
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Spring",
      includeSms: false,
    };
    await expect(
      copyGeneration.generateCopy(seed, "product_launch"),
    ).rejects.toThrow(/no tool use response/i);
  });
});
