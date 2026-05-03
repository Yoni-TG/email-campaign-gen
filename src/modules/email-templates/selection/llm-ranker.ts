import Anthropic from "@anthropic-ai/sdk";
import type { SkeletonManifest, SkeletonRanked } from "../types";
import type { SelectionInput } from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;

const RANK_TOOL: Anthropic.Tool = {
  name: "rank_skeletons",
  description:
    "Pick the top 3 email-template skeletons that best fit the campaign brief. " +
    "Each pick must be paired with a one-sentence rationale that grounds the choice " +
    "in concrete attributes of the brief (lead value, personality, product count, " +
    "campaign type alignment, etc.). All 3 skeleton_id values must come from the " +
    "candidate list provided in the user message.",
  input_schema: {
    type: "object",
    properties: {
      ranked: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            skeleton_id: { type: "string", description: "id of a candidate skeleton" },
            rationale: {
              type: "string",
              description:
                "One short sentence explaining why this skeleton fits — e.g. " +
                "'Editorial-led layout suits the warm-hearted brief and four-product capsule.'",
            },
          },
          required: ["skeleton_id", "rationale"],
          additionalProperties: false,
        },
      },
    },
    required: ["ranked"],
    additionalProperties: false,
  },
};

let anthropicClient: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (anthropicClient) return anthropicClient;
  anthropicClient = new Anthropic();
  return anthropicClient;
}

function buildUserPrompt(
  input: SelectionInput,
  candidates: SkeletonManifest[],
): string {
  // Surface campaignTypes on each candidate so the model sees which match
  // the brief's type and which don't. The `description` field is the
  // primary structural signal (it says what shape the email takes); tags
  // are secondary keywords.
  const candidateSummary = candidates
    .map(
      (c) =>
        `- id: ${c.id}\n` +
        `  name: ${c.name}\n` +
        `  campaign_types: ${c.campaignTypes.join(", ")}\n` +
        `  tags: ${c.tags.join(", ")}\n` +
        `  description: ${c.description}`,
    )
    .join("\n");

  const briefLines = [
    `<campaign_type>${input.campaignType}</campaign_type>`,
    input.leadValue ? `<lead_value>${input.leadValue}</lead_value>` : null,
    input.leadPersonalities?.length
      ? `<lead_personalities>${input.leadPersonalities.join(", ")}</lead_personalities>`
      : null,
    typeof input.productCount === "number"
      ? `<product_count>${input.productCount}</product_count>`
      : null,
    typeof input.bodyBlockCount === "number"
      ? `<body_block_count>${input.bodyBlockCount}</body_block_count>`
      : null,
    input.hasNickyQuote
      ? `<has_nicky_quote>yes</has_nicky_quote>`
      : null,
    input.mainMessage
      ? `<main_message>${input.mainMessage}</main_message>`
      : null,
  ].filter(Boolean);

  return [
    "Rank these candidate email-template skeletons for the campaign brief below.",
    "",
    "## How to rank",
    "",
    "- `<campaign_type>` is a STRONG soft signal. In a normal pick, 2 or 3 of your 3 chosen skeletons should have the brief's campaign_type in their `campaign_types` list.",
    "- An off-type skeleton may win a slot when its description / tags / structure clearly fit the brief better than any in-type alternative — for example, an editorial-led skeleton on a product launch with a quiet, story-led main message, or a quote-led skeleton on a brief that flags `has_nicky_quote: yes`.",
    "- Beyond type, weigh: lead_value (emotional anchor), lead_personalities (voice), product_count (does the layout's grid fit?), body_block_count (does the layout have enough sections?), main_message (does the structure match the angle?).",
    "- Your three picks should feel meaningfully different from each other — give the operator structural variety to choose between, not three near-duplicates.",
    "- Each rationale should reference at least one concrete brief attribute (e.g. \"warm-hearted voice\", \"single-product launch\", \"has Nicky quote\") rather than generic phrasing.",
    "",
    "## Brief",
    "",
    briefLines.join("\n"),
    "",
    "## Candidate skeletons",
    "",
    candidateSummary,
  ].join("\n");
}

/**
 * Calls Claude to pick the top 3 skeletons from a pool of >3 candidates.
 * Dormant in v1 (each campaign type ships with exactly 3 skeletons), but
 * exists, is tested, and activates the moment any pool grows past 3.
 */
export async function rankWithLLM(
  input: SelectionInput,
  candidates: SkeletonManifest[],
): Promise<SkeletonRanked[]> {
  if (candidates.length <= 3) {
    // Defensive: callers should already guard. Returning all-as-is keeps
    // behaviour consistent if a caller skips the check.
    return candidates.map((skeleton) => ({ skeleton, rationale: null }));
  }

  const client = getAnthropic();

  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL || DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    tools: [RANK_TOOL],
    tool_choice: { type: "tool", name: RANK_TOOL.name },
    messages: [{ role: "user", content: buildUserPrompt(input, candidates) }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(
      "Skeleton ranking failed: no tool use response from Claude. " +
        "Check CLAUDE_MODEL and the rank_skeletons tool schema.",
    );
  }

  const { ranked } = toolUse.input as {
    ranked: Array<{ skeleton_id: string; rationale: string }>;
  };

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const result: SkeletonRanked[] = [];
  for (const pick of ranked) {
    const skeleton = byId.get(pick.skeleton_id);
    if (skeleton) {
      result.push({ skeleton, rationale: pick.rationale });
    }
  }

  // Pad with unranked candidates if Claude returned fewer than 3 valid ids
  // (defensive — keeps the operator UI from breaking on a malformed call).
  if (result.length < 3) {
    const used = new Set(result.map((r) => r.skeleton.id));
    for (const c of candidates) {
      if (result.length >= 3) break;
      if (!used.has(c.id)) {
        result.push({ skeleton: c, rationale: null });
      }
    }
  }

  return result.slice(0, 3);
}
