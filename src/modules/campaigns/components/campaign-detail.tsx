"use client";

import type { Campaign } from "@/lib/types";
import { GeneratingView } from "./generating-view";
import { ReviewView } from "./review-view";
import { RenderingCandidatesView } from "./rendering-candidates-view";
import { VariantSelectionView } from "./variant-selection-view";
import { AssetUploadView } from "./asset-upload-view";
import { RenderingFinalView } from "./rendering-final-view";
import { CompletedView } from "./completed-view";

interface Props {
  campaign: Campaign;
  /** Server-rendered editable HTML for the click-to-edit completed view.
   *  Computed in app/campaigns/[id]/page.tsx and only populated when
   *  status === "completed". */
  editableHtml: string | null;
}

export function CampaignDetail({ campaign, editableHtml }: Props) {
  switch (campaign.status) {
    case "draft":
    case "generating":
      return <GeneratingView campaignId={campaign.id} error={campaign.error} />;
    case "review":
      return <ReviewView campaign={campaign} />;
    case "rendering_candidates":
      return <RenderingCandidatesView campaign={campaign} />;
    case "variant_selection":
      return <VariantSelectionView campaign={campaign} />;
    case "asset_upload":
      return <AssetUploadView campaign={campaign} />;
    case "rendering_final":
      return <RenderingFinalView campaign={campaign} />;
    case "completed":
      return (
        <CompletedView campaign={campaign} editableHtml={editableHtml} />
      );
  }
}
