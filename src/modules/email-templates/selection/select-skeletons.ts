import { loadAllSkeletons } from "../skeletons";
import type { SkeletonRanked } from "../types";
import { rankWithLLM } from "./llm-ranker";
import type { SelectionInput } from "./types";

/**
 * Picks 3 skeleton candidates for a campaign.
 *
 * Phase-1 (2026-05-03): the LLM ranker is the primary picker. The full
 * library is handed to the ranker on every call; `campaignType` is a
 * strong soft signal in the prompt rather than a hard pre-filter. This
 * fixes the v1 problem where every campaign of a given type saw the same
 * 3 skeletons because the type filter pre-empted the ranker.
 *
 * The pool is still capped to 15 manifests (the bundled library), so the
 * ranker call is cheap (single LLM tool call).
 *
 * Defensive: if the library somehow ships with ≤ 3 manifests (only
 * possible during local development with a stripped-down skeleton set),
 * skip the ranker — there's nothing to rank.
 */
export async function selectSkeletons(
  input: SelectionInput,
  options?: { signal?: AbortSignal },
): Promise<SkeletonRanked[]> {
  const all = loadAllSkeletons();

  if (all.length <= 3) {
    return all.map((skeleton) => ({ skeleton, rationale: null }));
  }

  return rankWithLLM(input, all, options);
}
