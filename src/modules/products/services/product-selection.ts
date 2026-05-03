import Anthropic from "@anthropic-ai/sdk";
import type {
  CampaignType,
  CreativeSeed,
  DigestedProduct,
  ProductSnapshot,
} from "@/lib/types";
import {
  ensureFeedLoaded,
  getCachedProducts,
  getProductBySku,
} from "@/modules/products/services/product-feed";
import { filterProducts } from "@/modules/products/utils/product-filter";
import { toProductSnapshot } from "@/modules/products/utils/product-api-shape";
import {
  buildRerankSystemPrompt,
  buildRerankUserPrompt,
} from "@/modules/products/utils/product-rerank-prompt";
import { withRetry } from "@/lib/retry";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const RERANK_MAX_TOKENS = 2048;

const RANK_TOOL: Anthropic.Tool = {
  name: "rank_products",
  description:
    "Return the SKUs of the most relevant products for this campaign, " +
    "ordered most relevant first. Every SKU MUST come from the <candidates> " +
    "list in the user message — never invent SKUs or pull from memory.",
  input_schema: {
    type: "object",
    properties: {
      skus: {
        type: "array",
        items: { type: "string" },
        description:
          "Top N product SKUs, most relevant first. Length must equal the " +
          "count specified in the user message. Each SKU must appear in " +
          "<candidates>.",
      },
    },
    required: ["skus"],
    additionalProperties: false,
  },
};

let anthropicClient: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (anthropicClient) return anthropicClient;
  anthropicClient = new Anthropic();
  return anthropicClient;
}

interface RerankValidation {
  /** SKUs accepted: in the candidate set, distinct, in the order returned. */
  valid: string[];
  /** SKUs the LLM returned that aren't in the candidate set. */
  invalid: string[];
  /** True when valid.length >= count and invalid is empty. */
  ok: boolean;
}

function validateRerankSkus(
  returned: unknown,
  candidateSet: Set<string>,
  count: number,
): RerankValidation {
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  if (Array.isArray(returned)) {
    for (const item of returned) {
      if (typeof item !== "string") continue;
      if (seen.has(item)) continue;
      seen.add(item);
      if (candidateSet.has(item)) valid.push(item);
      else invalid.push(item);
    }
  }

  return { valid, invalid, ok: invalid.length === 0 && valid.length >= count };
}

function buildRerankRetryMessage(
  validation: RerankValidation,
  count: number,
): string {
  const parts: string[] = [];
  if (validation.invalid.length > 0) {
    parts.push(
      `${validation.invalid.length} returned SKU(s) are NOT in the ` +
        `<candidates> list and were rejected: ${validation.invalid.join(", ")}.`,
    );
  }
  if (validation.valid.length < count) {
    parts.push(
      `Need ${count} valid SKUs total but only got ${validation.valid.length}.`,
    );
  }
  parts.push(
    `Re-emit the tool call with exactly ${count} SKUs, every one drawn ` +
      `from the <candidates> list above. Order most relevant first.`,
  );
  return parts.join(" ");
}

async function callRerank(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  options?: { signal?: AbortSignal },
): Promise<unknown> {
  const response = await withRetry(
    () =>
      client.messages.create(
        {
          model: process.env.CLAUDE_MODEL || DEFAULT_MODEL,
          max_tokens: RERANK_MAX_TOKENS,
          system: [
            {
              type: "text",
              text: buildRerankSystemPrompt(),
              // Stable prefix → cache across campaigns for repeated re-rank calls.
              cache_control: { type: "ephemeral" },
            },
          ],
          tools: [RANK_TOOL],
          tool_choice: { type: "tool", name: RANK_TOOL.name },
          messages,
        },
        { signal: options?.signal },
      ),
    { signal: options?.signal },
  );

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return null;
  return (toolUse.input as { skus?: unknown }).skus;
}

async function rerankWithLLM(
  candidates: DigestedProduct[],
  seed: CreativeSeed,
  campaignType: CampaignType,
  count: number,
  options?: { signal?: AbortSignal },
): Promise<string[]> {
  const client = getAnthropic();
  const candidateSet = new Set(candidates.map((c) => c.sku));
  const userPrompt = buildRerankUserPrompt(
    seed,
    campaignType,
    candidates,
    count,
  );
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  const firstSkus = await callRerank(client, messages, options);
  if (firstSkus === null) {
    // tool_choice forces a tool call; this branch indicates a malformed
    // response. Degrade gracefully to deterministic order so a single bad
    // response doesn't fail the whole campaign.
    return candidates.slice(0, count).map((p) => p.sku);
  }

  let validation = validateRerankSkus(firstSkus, candidateSet, count);
  if (validation.ok) return validation.valid.slice(0, count);

  // Single self-correction pass — mirrors the SMS-overshoot retry pattern in
  // copy-generation.ts. Hands the violations back as a tool_result error so
  // the model can correct without re-priming context.
  const retryMessages: Anthropic.MessageParam[] = [
    ...messages,
    {
      role: "assistant",
      content: [
        {
          type: "tool_use",
          id: "rerank_retry",
          name: RANK_TOOL.name,
          input: { skus: firstSkus } as Record<string, unknown>,
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "rerank_retry",
          content: buildRerankRetryMessage(validation, count),
          is_error: true,
        },
      ],
    },
  ];

  const secondSkus = await callRerank(client, retryMessages, options);
  if (secondSkus !== null) {
    validation = validateRerankSkus(secondSkus, candidateSet, count);
  }

  // Backfill from deterministic order if the model is still short — better
  // to ship N products than a half-empty grid. Items we add here come from
  // the (already audience- and category-filtered) candidate list.
  if (validation.valid.length < count) {
    const have = new Set(validation.valid);
    for (const c of candidates) {
      if (validation.valid.length >= count) break;
      if (!have.has(c.sku)) {
        validation.valid.push(c.sku);
        have.add(c.sku);
      }
    }
  }

  return validation.valid.slice(0, count);
}

/**
 * Two-stage product selection: deterministic filter, then LLM re-rank if the
 * candidate pool still exceeds the requested count. Pinned SKUs are prepended
 * in the order supplied and are never duplicated by the LLM pick.
 */
export async function selectProducts(
  seed: CreativeSeed,
  campaignType: CampaignType,
  count: number = 10,
  options?: { signal?: AbortSignal },
): Promise<ProductSnapshot[]> {
  await ensureFeedLoaded();
  const allProducts = getCachedProducts();

  const candidates = filterProducts(allProducts, {
    categories: seed.targetCategories,
    campaignType,
    pinnedSkus: seed.pinnedSkus,
    audience: seed.targetAudience,
  });

  const selectedSkus =
    candidates.length <= count
      ? candidates.map((p) => p.sku)
      : await rerankWithLLM(candidates, seed, campaignType, count, options);

  const pinnedSkus = seed.pinnedSkus ?? [];
  const pinnedSet = new Set(pinnedSkus);

  const result: ProductSnapshot[] = [];
  for (const sku of pinnedSkus) {
    const product = getProductBySku(sku);
    if (product) result.push(toProductSnapshot(product));
  }

  // Strict: LLM-returned SKUs must come from the candidate set. The earlier
  // `?? getProductBySku(sku)` fallback could let a hallucinated SKU bypass
  // the audience/category filter by re-fetching from the full feed.
  const candidateIndex = new Map(candidates.map((p) => [p.sku, p]));
  for (const sku of selectedSkus) {
    if (pinnedSet.has(sku)) continue;
    const product = candidateIndex.get(sku);
    if (product) result.push(toProductSnapshot(product));
  }

  return result.slice(0, count);
}
