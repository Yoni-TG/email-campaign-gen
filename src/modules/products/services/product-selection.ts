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
    "Return the SKUs of the most relevant products for this campaign, ordered by relevance.",
  input_schema: {
    type: "object",
    properties: {
      skus: {
        type: "array",
        items: { type: "string" },
        description: "Top N product SKUs, most relevant first.",
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

async function rerankWithLLM(
  candidates: DigestedProduct[],
  seed: CreativeSeed,
  campaignType: CampaignType,
  count: number,
  options?: { signal?: AbortSignal },
): Promise<string[]> {
  const client = getAnthropic();

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
          messages: [
            {
              role: "user",
              content: buildRerankUserPrompt(
                seed,
                campaignType,
                candidates,
                count,
              ),
            },
          ],
        },
        { signal: options?.signal },
      ),
    { signal: options?.signal },
  );

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (toolUse && toolUse.type === "tool_use") {
    const input = toolUse.input as { skus?: unknown };
    if (Array.isArray(input.skus)) {
      return input.skus.filter((x): x is string => typeof x === "string");
    }
  }

  // Fallback: the tool_choice should guarantee a tool call, but if the model
  // ever returns text instead we degrade gracefully to the deterministic order.
  return candidates.slice(0, count).map((p) => p.sku);
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

  const candidateIndex = new Map(candidates.map((p) => [p.sku, p]));
  for (const sku of selectedSkus) {
    if (pinnedSet.has(sku)) continue;
    const product = candidateIndex.get(sku) ?? getProductBySku(sku);
    if (product) result.push(toProductSnapshot(product));
  }

  return result.slice(0, count);
}
