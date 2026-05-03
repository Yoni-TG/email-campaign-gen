// Input shape for the selection engine. Independent of the Campaign type so
// this module can be reused (e.g. by a future preview-only flow that doesn't
// touch the DB).

import type {
  CampaignType,
  LeadPersonality,
  LeadValue,
  ShopForAudience,
} from "@/lib/types";

export interface SelectionInput {
  /** Strong soft signal for skeleton fit — most picks should be in-type. */
  campaignType: CampaignType;
  /**
   * Optional context for the LLM ranker. Used when the bundled library has
   * > 3 manifests; ignored on the defensive ≤ 3 short-circuit path.
   */
  leadValue?: LeadValue;
  leadPersonalities?: LeadPersonality[];
  productCount?: number;
  hasNickyQuote?: boolean;
  bodyBlockCount?: number;
  /** Optional — short summary of the campaign's main message, for ranker prompts. */
  mainMessage?: string;
  /**
   * Operator-selected audience values from the brief (Men / Women / Mother
   * / Father / Grandmother / Kids & Teens / Couple / Friends). Threaded
   * into the ranker so audience-coded layouts win for matching briefs —
   * e.g. typography / single-hero / grid-led for masculine briefs over
   * warm-hero family-coded layouts.
   */
  targetAudience?: ShopForAudience[];
}
