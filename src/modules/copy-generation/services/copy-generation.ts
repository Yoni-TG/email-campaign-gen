import Anthropic from "@anthropic-ai/sdk";
import type {
  CampaignType,
  CreativeSeed,
  GeneratedCopy,
} from "@/lib/types";
import {
  buildCopySystemPrompt,
  buildCopyUserPrompt,
} from "@/modules/copy-generation/utils/copy-prompt";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;

const COPY_TOOL: Anthropic.Tool = {
  name: "generate_campaign_copy",
  description:
    "Generate structured email campaign copy matching the GeneratedCopy schema.",
  input_schema: {
    type: "object",
    properties: {
      subjectLines: {
        type: "array",
        items: { type: "string" },
        description: "Exactly 3 subject-line options (emotional, curiosity, direct-benefit)",
      },
      preHeader: {
        type: "string",
        description: "Email pre-header text",
      },
      hero: {
        type: "object",
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          paragraph: { type: "string" },
        },
        required: ["title", "subtitle", "paragraph"],
        additionalProperties: false,
      },
      secondary: {
        type: "object",
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          ctaText: { type: "string" },
        },
        required: ["title", "subtitle", "ctaText"],
        additionalProperties: false,
      },
      primaryCtaText: { type: "string" },
      smsCopy: {
        type: "string",
        description: "SMS copy — only include when the brief requests it",
      },
    },
    required: [
      "subjectLines",
      "preHeader",
      "hero",
      "secondary",
      "primaryCtaText",
    ],
  },
};

let anthropicClient: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (anthropicClient) return anthropicClient;
  anthropicClient = new Anthropic();
  return anthropicClient;
}

/**
 * Generates campaign copy via a single Claude tool-use call. The system prompt
 * embeds the brand guide + few-shot examples and is marked for ephemeral
 * caching, so the large prefix is paid for once and then reused across
 * every campaign.
 */
export async function generateCopy(
  seed: CreativeSeed,
  campaignType: CampaignType,
): Promise<GeneratedCopy> {
  const client = getAnthropic();

  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL || DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: buildCopySystemPrompt(),
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [COPY_TOOL],
    tool_choice: { type: "tool", name: COPY_TOOL.name },
    messages: [
      { role: "user", content: buildCopyUserPrompt(seed, campaignType) },
    ],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(
      "Copy generation failed: no tool use response from Claude. " +
        "Check that CLAUDE_MODEL is set and the tool schema is valid.",
    );
  }

  return toolUse.input as GeneratedCopy;
}
