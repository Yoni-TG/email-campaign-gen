import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreativeSeed, GeneratedCopy } from "@/lib/types";

const MOCK_COPY: GeneratedCopy = {
  free_top_text: "NEW COLLECTION",
  body_blocks: [
    {
      title: "Made for You",
      description: "Explore pieces designed with you in mind.",
      cta: "Shop the Collection",
    },
    {
      title: "Trending Now",
      description: "See what everyone's loving.",
      cta: "See All",
    },
  ],
  subject_variants: [
    {
      subject: "Your next favorite piece is waiting",
      preheader: "Discover our latest collection",
    },
    {
      subject: "Personalized, just for you",
      preheader: "Meaningful pieces made to order",
    },
  ],
  sms: "New drop just landed! Shop now: {link}",
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

    expect(result.subject_variants.length).toBeGreaterThanOrEqual(1);
    expect(result.body_blocks.length).toBeGreaterThan(0);
    expect(result.body_blocks[0].title).toBeTruthy();
    expect(result.subject_variants[0].subject).toBeTruthy();
    expect(result.subject_variants[0].preheader).toBeTruthy();
  });

  it("returns sms when the seed requested it", async () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Spring",
      includeSms: true,
    };
    const result = await copyGeneration.generateCopy(seed, "product_launch");
    expect(result.sms).toBeTruthy();
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

  it("tool schema requires all four top-level fields", async () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Spring",
      includeSms: false,
    };
    await copyGeneration.generateCopy(seed, "product_launch");
    const tool = messagesCreate.mock.calls[0][0].tools[0];
    expect(tool.input_schema.required).toEqual(
      expect.arrayContaining([
        "free_top_text",
        "body_blocks",
        "subject_variants",
        "sms",
      ]),
    );
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
