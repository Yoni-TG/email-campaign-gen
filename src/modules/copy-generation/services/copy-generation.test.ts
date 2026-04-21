import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreativeSeed } from "@/lib/types";

function makeSeed(overrides: Partial<CreativeSeed> = {}): CreativeSeed {
  return {
    targetCategories: ["Necklace"],
    mainMessage: "Spring",
    includeSms: false,
    leadValue: "joy",
    leadPersonalities: ["joyfully_characterful"],
    ...overrides,
  };
}

// The LLM emits everything except campaign_id — the service attaches it.
const MOCK_LLM_OUTPUT = {
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

const TEST_CAMPAIGN_ID = "cmp_01H123ABC";

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
        input: MOCK_LLM_OUTPUT,
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
    const seed = makeSeed({
      mainMessage: "Spring collection launch",
      includeSms: true,
    });
    const result = await copyGeneration.generateCopy(
      TEST_CAMPAIGN_ID,
      seed,
      "product_launch",
    );

    expect(result.subject_variants.length).toBeGreaterThanOrEqual(1);
    expect(result.body_blocks.length).toBeGreaterThan(0);
    expect(result.body_blocks[0].title).toBeTruthy();
    expect(result.subject_variants[0].subject).toBeTruthy();
    expect(result.subject_variants[0].preheader).toBeTruthy();
  });

  it("attaches the campaign_id to the returned payload", async () => {
    const seed = makeSeed();
    const result = await copyGeneration.generateCopy(
      TEST_CAMPAIGN_ID,
      seed,
      "product_launch",
    );
    expect(result.campaign_id).toBe(TEST_CAMPAIGN_ID);
  });

  it("passes lead value and lead personalities through the user prompt", async () => {
    const seed = makeSeed({
      leadValue: "meaningful_moments",
      leadPersonalities: ["warm_hearted", "charming"],
    });
    await copyGeneration.generateCopy(
      TEST_CAMPAIGN_ID,
      seed,
      "product_launch",
    );
    const userContent = messagesCreate.mock.calls[0][0].messages[0].content;
    expect(userContent).toMatch(/Lead value: Meaningful Moments/);
    expect(userContent).toMatch(/Warm-hearted.*Charming|Charming.*Warm-hearted/);
  });

  it("returns sms when the seed requested it", async () => {
    const seed = makeSeed({ includeSms: true });
    const result = await copyGeneration.generateCopy(
      TEST_CAMPAIGN_ID,
      seed,
      "product_launch",
    );
    expect(result.sms).toBeTruthy();
  });

  it("calls messages.create with generate_campaign_copy tool + cache_control on system", async () => {
    const seed = makeSeed();
    await copyGeneration.generateCopy(
      TEST_CAMPAIGN_ID,
      seed,
      "product_launch",
    );

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

  it("tool schema requires the four LLM-owned top-level fields (not campaign_id)", async () => {
    const seed = makeSeed();
    await copyGeneration.generateCopy(
      TEST_CAMPAIGN_ID,
      seed,
      "product_launch",
    );
    const tool = messagesCreate.mock.calls[0][0].tools[0];
    expect(tool.input_schema.required).toEqual(
      expect.arrayContaining([
        "free_top_text",
        "body_blocks",
        "subject_variants",
        "sms",
      ]),
    );
    // campaign_id is attached by the service, not the LLM — it must NOT be
    // in the tool schema.
    expect(tool.input_schema.required).not.toContain("campaign_id");
    expect(tool.input_schema.properties.campaign_id).toBeUndefined();
  });

  it("throws a descriptive error when the model response has no tool_use block", async () => {
    messagesCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "no tool call here" }],
    });
    const seed = makeSeed();
    await expect(
      copyGeneration.generateCopy(TEST_CAMPAIGN_ID, seed, "product_launch"),
    ).rejects.toThrow(/no tool use response/i);
  });
});
