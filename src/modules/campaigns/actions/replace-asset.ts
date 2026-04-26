import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Campaign, FinalRenderResult } from "@/lib/types";
import { renderSkeleton } from "@/modules/email-templates";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import { buildBlueprint } from "@/modules/campaigns/utils/build-blueprint";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface ReplaceAssetResult {
  status: "completed";
  renderResult: FinalRenderResult;
}

const UPLOADS_DIR = "uploads";

function inferExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1 || dot === filename.length - 1) return "jpg";
  return filename.slice(dot + 1).toLowerCase();
}

// Fine-tune action — replace one asset on a completed campaign and
// immediately re-run the final render. Status stays at completed; the
// completed view picks up the new renderResult on the next refresh.
//
// Files land at /uploads/<campaignId>/<slotKey>.<ext>, reusing the
// per-campaign-per-slot path scheme so the URL stays stable across
// replacements (same key = same URL, just new bytes).
export async function replaceAsset(
  campaign: Campaign,
  slotKey: string,
  file: File,
): Promise<ReplaceAssetResult> {
  if (!campaign.chosenSkeletonId) {
    throw new Error(
      "Campaign has no chosenSkeletonId — fine-tune requires a chosen variant.",
    );
  }
  if (!campaign.approvedCopy || !campaign.approvedProducts) {
    throw new Error("Campaign missing approved copy or products.");
  }

  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) {
    throw new Error(`Unknown chosenSkeletonId "${campaign.chosenSkeletonId}".`);
  }
  const slot = skeleton.requiredAssets.find((a) => a.key === slotKey);
  if (!slot) {
    throw new Error(
      `Skeleton ${skeleton.id} has no asset slot "${slotKey}". Allowed: ${skeleton.requiredAssets
        .map((a) => a.key)
        .join(", ")}`,
    );
  }

  const dir = join(process.cwd(), UPLOADS_DIR, campaign.id);
  await mkdir(dir, { recursive: true });

  const ext = inferExtension(file.name);
  const filename = `${slotKey}.${ext}`;
  const filepath = join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const url = `/${UPLOADS_DIR}/${campaign.id}/${filename}`;
  const assetPaths = { ...(campaign.assetPaths ?? {}), [slotKey]: url };

  // Re-run final render immediately so the operator sees the result on
  // the next refresh without an explicit "render now" step.
  const blueprint = buildBlueprint({
    campaignId: campaign.id,
    seed: campaign.seed,
    approvedCopy: campaign.approvedCopy,
    approvedProducts: campaign.approvedProducts,
    assets: assetPaths,
  });
  const { html } = await renderSkeleton(skeleton, blueprint, {
    withAssets: true,
  });
  const renderResult: FinalRenderResult = {
    skeletonId: skeleton.id,
    html,
    renderedAt: new Date().toISOString(),
  };

  await updateCampaign(campaign.id, {
    assetPaths,
    renderResult,
    error: null,
  });

  return { status: "completed", renderResult };
}
