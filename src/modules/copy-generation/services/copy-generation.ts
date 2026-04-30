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
import { withRetry } from "@/lib/retry";
import { SMS_HARD_CAP, smsRenderedLength } from "@/lib/sms";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;

const COPY_TOOL: Anthropic.Tool = {
  name: "generate_campaign_copy",
  description:
    "Return the Theo Grace email campaign copy matching the §11 Output Contract " +
    "(free_top_text, body_blocks, subject_variants, sms, nicky_quote).",
  input_schema: {
    type: "object",
    properties: {
      free_top_text: {
        type: ["string", "null"],
        description:
          "Optional banner text above the hero image (e.g. 'Happy New Year'). null when the campaign doesn't need one. Keep short — max ~40 chars.",
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
              description:
                "Short H1 or sub-label for the section (brand-guide §10: 2-6 words; mantra, provocation, or product tag). null if not needed.",
            },
            description: {
              type: ["string", "null"],
              description:
                "Body paragraph(s). Paragraphs are 1-3 short sentences (brand-guide §10). null if the section is title + CTA only.",
            },
            cta: {
              type: ["string", "null"],
              description:
                "CTA button label — action + specific outcome (e.g. 'Shop the stack', 'See Nicky's picks'). Never 'Click here', 'Learn more', 'Buy now'. null if the section doesn't need a button.",
            },
            cta_href: {
              type: ["string", "null"],
              description:
                "Destination URL for the CTA. null when the operator hasn't decided yet — they fill it in during review. Always emit null; do NOT invent URLs.",
            },
          },
          required: ["title", "description", "cta", "cta_href"],
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
              description:
                "Email subject line. Target <50 chars. Friend-texting you, not a brand shouting. Never ALL CAPS, 'Don't miss out!', 'Last chance!', generic 'Summer Sale'.",
            },
            preheader: {
              type: "string",
              description:
                "Preheader that extends or contrasts the subject — don't repeat it. Sentence case. No salesy clichés.",
            },
          },
          required: ["subject", "preheader"],
          additionalProperties: false,
        },
      },
      sms: {
        type: ["string", "null"],
        description:
          "SMS copy. Use {link} as the URL placeholder — the send system substitutes it with a Klaviyo short link up to 24 characters long. The TOTAL rendered length (with {link} expanded to 24 chars) MUST be ≤130 chars including spaces and emoji. So when the SMS contains {link}, the literal template length must be ≤112; without {link}, ≤130. null when SMS isn't requested.",
      },
      nicky_quote: {
        type: ["object", "null"],
        description:
          "Optional Nicky Hilton quote per brand-guide §7. Use only when a claim about Theo Grace would sound boastful in our own voice. Max one per email. null when not needed.",
        properties: {
          quote: {
            type: "string",
            description:
              "Short, specific, on-persona quote from Nicky. Must sound like a real person — not marketing copy.",
          },
          response: {
            type: ["string", "null"],
            description:
              "Optional warm reply after the quote (e.g. 'Thank you Nicky!'). null when the quote stands alone.",
          },
        },
        required: ["quote", "response"],
        additionalProperties: false,
      },
    },
    required: [
      "free_top_text",
      "body_blocks",
      "subject_variants",
      "sms",
      "nicky_quote",
    ],
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
  options?: { signal?: AbortSignal },
): Promise<GeneratedCopy> {
  const client = getAnthropic();
  const userPrompt = buildCopyUserPrompt(seed, campaignType);
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  let llmOutput = await callClaude(client, messages, options);

  // Single self-correction pass: if SMS overshot the rendered cap,
  // hand the bad output back to Claude with the actual rendered length
  // and ask it to retry. The model usually complies on round 2.
  const renderedSmsLen = smsRenderedLength(llmOutput.sms);
  if (renderedSmsLen > SMS_HARD_CAP) {
    console.warn(
      `[copy-generation] sms overshot: rendered ${renderedSmsLen} > ${SMS_HARD_CAP}; retrying once`,
    );
    const retryMessages: Anthropic.MessageParam[] = [
      ...messages,
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "sms_overshoot_retry",
            name: COPY_TOOL.name,
            input: llmOutput as unknown as Record<string, unknown>,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: "sms_overshoot_retry",
            content:
              `SMS exceeded the wire cap. The rendered length (with {link} ` +
              `expanded to 24 chars) is ${renderedSmsLen}; the hard cap is ` +
              `${SMS_HARD_CAP}. Re-emit the entire tool call with a shorter ` +
              `\`sms\` so its rendered length is ≤${SMS_HARD_CAP}. Keep ` +
              `every other field byte-identical.`,
            is_error: true,
          },
        ],
      },
    ];
    llmOutput = await callClaude(client, retryMessages, options);
  }

  return { campaign_id: campaignId, ...llmOutput };
}

async function callClaude(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  options?: { signal?: AbortSignal },
): Promise<Omit<GeneratedCopy, "campaign_id">> {
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
          tools: [COPY_TOOL],
          tool_choice: { type: "tool", name: COPY_TOOL.name },
          messages,
        },
        { signal: options?.signal },
      ),
    { signal: options?.signal },
  );

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(
      "Copy generation failed: no tool use response from Claude. " +
        "Check that CLAUDE_MODEL is set and the tool schema is valid.",
    );
  }
  return toolUse.input as Omit<GeneratedCopy, "campaign_id">;
}
