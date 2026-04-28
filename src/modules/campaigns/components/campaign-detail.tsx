"use client";

import { CAMPAIGN_STATUS_LABELS, type Campaign } from "@/lib/types";
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

function renderView(campaign: Campaign, editableHtml: string | null) {
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
      return <CompletedView campaign={campaign} editableHtml={editableHtml} />;
  }
}

export function CampaignDetail({ campaign, editableHtml }: Props) {
  return (
    <>
      {/* Off-screen live region — screen readers announce the new status
          label whenever the polling hook refreshes the page and pushes us
          into a new view. Sighted users see the StatusBadge inside each
          view; this is purely additive for assistive tech. */}
      <div role="status" aria-live="polite" className="sr-only">
        Campaign status: {CAMPAIGN_STATUS_LABELS[campaign.status]}
      </div>
      {renderView(campaign, editableHtml)}
    </>
  );
}
