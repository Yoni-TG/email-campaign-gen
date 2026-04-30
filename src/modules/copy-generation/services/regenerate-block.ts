import Anthropic from "@anthropic-ai/sdk";
import type { BodyBlock, CampaignType, CreativeSeed } from "@/lib/types";
import {
  buildCopySystemPrompt,
  buildCopyUserPrompt,
} from "@/modules/copy-generation/utils/copy-prompt";
import { withRetry } from "@/lib/retry";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 512;

const REGEN_TOOL: Anthropic.Tool = {
  name: "regenerate_body_block",
  description:
    "Return a single body block (title / description / cta / cta_href) " +
    "to replace one section of an existing email. Match the brand guide " +
    "and the brief; do not duplicate the wording of the block being replaced.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: ["string", "null"],
        description:
          "Short H1 or sub-label (brand-guide §10: 2-6 words). null if not needed.",
      },
      description: {
        type: ["string", "null"],
        description:
          "Body paragraph(s). 1-3 short sentences (brand-guide §10). null if title + CTA only.",
      },
      cta: {
        type: ["string", "null"],
        description:
          "CTA button label — action + specific outcome. Never 'Click here', 'Learn more', 'Buy now'. null if no button.",
      },
      cta_href: {
        type: ["string", "null"],
        description:
          "Destination URL for the CTA. Always emit null; do NOT invent URLs.",
      },
    },
    required: ["title", "description", "cta", "cta_href"],
    additionalProperties: false,
  },
};

let anthropicClient: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (anthropicClient) return anthropicClient;
  anthropicClient = new Anthropic();
  return anthropicClient;
}

export interface RegenerateBlockInput {
  seed: CreativeSeed;
  campaignType: CampaignType;
  blocks: BodyBlock[];
  /** 0-based index of the block being replaced. */
  index: number;
  signal?: AbortSignal;
}

// Asks Claude for one fresh body block to replace blocks[index]. Reuses
// the cached system prompt (brand guide + few-shots + winning subjects)
// so cost stays small after the first request — we only pay for the
// short user prompt + the focused tool output.
export async function regenerateBlock(
  input: RegenerateBlockInput,
): Promise<BodyBlock> {
  if (input.index < 0 || input.index >= input.blocks.length) {
    throw new Error(
      `regenerateBlock: index ${input.index} out of range (0..${input.blocks.length - 1})`,
    );
  }
  const client = getAnthropic();

  const briefContext = buildCopyUserPrompt(input.seed, input.campaignType);
  const blocksContext = input.blocks
    .map(
      (b, i) =>
        `Block ${i}${i === input.index ? " (REPLACE THIS ONE)" : ""}:\n` +
        `  title: ${quoteOrNull(b.title)}\n` +
        `  description: ${quoteOrNull(b.description)}\n` +
        `  cta: ${quoteOrNull(b.cta)}`,
    )
    .join("\n\n");

  const userPrompt =
    briefContext +
    `\n\n` +
    `## Existing email body blocks (current copy)\n` +
    blocksContext +
    `\n\n` +
    `## Your task\n` +
    `Return one fresh body block to replace block ${input.index} above. ` +
    `Keep the role of that block in the email's flow (hero opener, ` +
    `mid-copy, closing CTA, etc.) but vary the angle, hook, or phrasing. ` +
    `Do not duplicate any wording from the block being replaced. ` +
    `Stay consistent in voice and energy with the surrounding blocks. ` +
    `Call the regenerate_body_block tool.`;

  const response = await withRetry(
    () =>
      client.messages.create(
        {
          model: process.env.CLAUDE_MODEL || DEFAULT_MODEL,
          max_tokens: MAX_TOKENS,
          system: [
            {
              type: "text",
              text: buildCopySystemPrompt(),
              cache_control: { type: "ephemeral" },
            },
          ],
          tools: [REGEN_TOOL],
          tool_choice: { type: "tool", name: REGEN_TOOL.name },
          messages: [{ role: "user", content: userPrompt }],
        },
        { signal: input.signal },
      ),
    { signal: input.signal },
  );

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(
      "Block regeneration failed: no tool_use response from Claude.",
    );
  }
  return toolUse.input as BodyBlock;
}

function quoteOrNull(value: string | null | undefined): string {
  return value ? JSON.stringify(value) : "null";
}
