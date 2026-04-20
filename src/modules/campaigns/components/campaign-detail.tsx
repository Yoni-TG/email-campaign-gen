"use client";

import type { Campaign } from "@/lib/types";
import { GeneratingView } from "./generating-view";
import { ReviewView } from "./review-view";
import { HeroUploadView } from "./hero-upload-view";
import { FillingFigmaView } from "./filling-figma-view";
import { VariantSelectionView } from "./variant-selection-view";
import { CompletedView } from "./completed-view";

export function CampaignDetail({ campaign }: { campaign: Campaign }) {
  switch (campaign.status) {
    case "draft":
    case "generating":
      return <GeneratingView campaignId={campaign.id} error={campaign.error} />;
    case "review":
      return <ReviewView campaign={campaign} />;
    case "hero_upload":
      return <HeroUploadView campaign={campaign} />;
    case "filling_figma":
      return <FillingFigmaView campaign={campaign} />;
    case "variant_selection":
      return <VariantSelectionView campaign={campaign} />;
    case "completed":
      return <CompletedView campaign={campaign} />;
  }
}
