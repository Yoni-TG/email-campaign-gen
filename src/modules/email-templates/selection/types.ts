// Input shape for the selection engine. Independent of the Campaign type so
// this module can be reused (e.g. by a future preview-only flow that doesn't
// touch the DB).

import type { CampaignType, LeadPersonality, LeadValue } from "@/lib/types";

export interface SelectionInput {
  /** Required — narrows the candidate pool. */
  campaignType: CampaignType;
  /**
   * Optional context for the LLM ranker. Ignored when the pool size is
   * ≤ 3 (v1 path — ranker doesn't run).
   */
  leadValue?: LeadValue;
  leadPersonalities?: LeadPersonality[];
  productCount?: number;
  hasNickyQuote?: boolean;
  bodyBlockCount?: number;
  /** Optional — short summary of the campaign's main message, for ranker prompts. */
  mainMessage?: string;
}
