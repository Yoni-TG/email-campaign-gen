import { loadAllSkeletons } from "../skeletons";
import type { SkeletonRanked } from "../types";
import { rankWithLLM } from "./llm-ranker";
import type { SelectionInput } from "./types";

/**
 * Picks 3 skeleton candidates for a campaign:
 *
 * 1. Narrow the pool to skeletons whose `campaignTypes` includes the brief's
 *    type (rules-narrows step — deterministic, cheap).
 * 2. If ≤ 3 candidates, return all of them (v1 path; ranker doesn't run).
 * 3. Otherwise, hand the candidates to the LLM ranker, which returns the
 *    top 3 with one-sentence rationales.
 */
export async function selectSkeletons(
  input: SelectionInput,
): Promise<SkeletonRanked[]> {
  const all = loadAllSkeletons();
  const candidates = all.filter((s) =>
    s.campaignTypes.includes(input.campaignType),
  );

  if (candidates.length <= 3) {
    return candidates.map((skeleton) => ({ skeleton, rationale: null }));
  }

  return rankWithLLM(input, candidates);
}
