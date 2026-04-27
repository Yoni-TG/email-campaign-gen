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
    "in concrete attributes of the brief (lead value, personality, product count, etc.).",
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
  const candidateSummary = candidates
    .map(
      (c) =>
        `- id: ${c.id}\n  name: ${c.name}\n  tags: ${c.tags.join(", ")}\n  description: ${c.description}`,
    )
    .join("\n");

  const briefLines = [
    `Campaign type: ${input.campaignType}`,
    input.leadValue ? `Lead value: ${input.leadValue}` : null,
    input.leadPersonalities?.length
      ? `Lead personalities: ${input.leadPersonalities.join(", ")}`
      : null,
    typeof input.productCount === "number"
      ? `Approved products: ${input.productCount}`
      : null,
    typeof input.bodyBlockCount === "number"
      ? `Approved body blocks: ${input.bodyBlockCount}`
      : null,
    input.hasNickyQuote ? `Includes a Nicky Hilton quote: yes` : null,
    input.mainMessage ? `Main message: ${input.mainMessage}` : null,
  ].filter(Boolean);

  return [
    "Rank these candidate email-template skeletons for the campaign brief below.",
    "Pick the top 3, each with a single-sentence rationale that ties the pick to a concrete attribute of the brief.",
    "",
    "Brief:",
    briefLines.join("\n"),
    "",
    "Candidate skeletons:",
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
