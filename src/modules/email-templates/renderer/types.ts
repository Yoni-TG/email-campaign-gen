// Renderer-local input shape. The renderer consumes structured campaign
// content + uploaded asset URLs and resolves manifest bind paths against it.
//
// This shape mirrors CampaignBlueprint (src/lib/types.ts) with one evolution:
// the legacy `hero_image_url: string` is replaced by `assets: Record<string,
// string>`, allowing skeletons to reference any number of named assets via
// `assets.<key>` bind paths. Step 2 of the email-templates rollout aligns
// CampaignBlueprint to this shape.

import type { BlueprintProduct } from "../blocks/types";

export interface RendererBlueprint {
  campaign_id: string;
  lead_value: string;
  lead_personalities: string[];
  market: string;
  free_top_text: string | null;
  subject_variant: { subject: string; preheader: string };
  body_blocks: Array<{
    title: string | null;
    description: string | null;
    cta: string | null;
  }>;
  sms: string | null;
  nicky_quote: { quote: string; response: string | null } | null;
  products: BlueprintProduct[];
  /**
   * Operator-uploaded asset URLs keyed by AssetSlot.key. Resolved by
   * `assets.<key>` bind paths. Empty/missing during the candidate-preview
   * phase; populated after asset_upload.
   */
  assets: Record<string, string>;
}
