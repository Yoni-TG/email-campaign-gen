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
    "Return the Theo Grace email campaign copy matching the §11 Output Contract " +
    "(free_top_text, body_blocks, subject_variants, sms).",
  input_schema: {
    type: "object",
    properties: {
      free_top_text: {
        type: ["string", "null"],
        description:
          "Optional banner text above the hero image (e.g. 'TIMELESS. ALWAYS HAS BEEN'). null when the campaign doesn't need one.",
      },
      body_blocks: {
        type: "array",
        description:
          "Email body sections in reading order: index 0 sits directly under the hero, index 1 below, and so on. 1-3 blocks is typical.",
        items: {
          type: "object",
          properties: {
            title: {
              type: ["string", "null"],
              description: "Short H1 or sub-label for the section. null if not needed.",
            },
            description: {
              type: ["string", "null"],
              description: "Body paragraph(s). null if the section is title + CTA only.",
            },
            cta: {
              type: ["string", "null"],
              description: "CTA button label for the section. null if not needed.",
            },
          },
          required: ["title", "description", "cta"],
          additionalProperties: false,
        },
      },
      subject_variants: {
        type: "array",
        description: "1-2 subject + preheader pairs for A/B testing.",
        items: {
          type: "object",
          properties: {
            subject: {
              type: "string",
              description: "Email subject line. Under 50 chars preferred.",
            },
            preheader: {
              type: "string",
              description: "Preheader that extends (not repeats) the subject.",
            },
          },
          required: ["subject", "preheader"],
          additionalProperties: false,
        },
      },
      sms: {
        type: ["string", "null"],
        description:
          "SMS copy ≤130 chars (including spaces and emoji). Use {link} as the URL placeholder. null when SMS isn't requested.",
      },
    },
    required: ["free_top_text", "body_blocks", "subject_variants", "sms"],
    additionalProperties: false,
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
 *
 * campaign_id is attached by this layer, not emitted by the LLM, so the
 * stored generated_copy JSON can be looked up independently of the
 * surrounding Campaign row.
 */
export async function generateCopy(
  campaignId: string,
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

  const llmOutput = toolUse.input as Omit<GeneratedCopy, "campaign_id">;
  return { campaign_id: campaignId, ...llmOutput };
}
