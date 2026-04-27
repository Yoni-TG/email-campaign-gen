import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Campaign } from "@/lib/types";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface UploadAssetResult {
  /** Stays in asset_upload while required slots are still pending; advances to
   * rendering_final the moment all required slots are filled. */
  status: "asset_upload" | "rendering_final";
  /** Full assetPaths after this upload. */
  assetPaths: Record<string, string>;
  /** Required slot keys that still need uploads. Empty when status === rendering_final. */
  pendingRequired: string[];
}

const UPLOADS_DIR = "uploads";

function inferExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1 || dot === filename.length - 1) return "jpg";
  return filename.slice(dot + 1).toLowerCase();
}

// asset_upload → asset_upload (more required slots) or rendering_final
//
// Writes one uploaded file under uploads/<campaignId>/<slotKey>.<ext>, merges
// the URL into Campaign.assetPaths, and checks whether the chosen skeleton's
// required asset slots are all filled. When they are, advances to
// rendering_final so renderFinal can take over.
export async function uploadAsset(
  campaign: Campaign,
  slotKey: string,
  file: File,
): Promise<UploadAssetResult> {
  if (!campaign.chosenSkeletonId) {
    throw new Error(
      "Campaign has no chosenSkeletonId — select a variant before uploading assets.",
    );
  }
  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) {
    throw new Error(
      `Unknown chosenSkeletonId "${campaign.chosenSkeletonId}".`,
    );
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

  const pendingRequired = skeleton.requiredAssets
    .filter((a) => a.required && !assetPaths[a.key])
    .map((a) => a.key);

  // Don't regress the status: if a previous upload in the same batch
  // already advanced us to `rendering_final` (last required slot filled)
  // and the operator is now uploading an optional slot, keep us in
  // `rendering_final` — going back to `asset_upload` would block the
  // render-final trigger that fires after the upload loop completes.
  const nextStatus: UploadAssetResult["status"] =
    pendingRequired.length === 0 || campaign.status === "rendering_final"
      ? "rendering_final"
      : "asset_upload";

  await updateCampaign(campaign.id, {
    assetPaths,
    status: nextStatus,
  });

  return { status: nextStatus, assetPaths, pendingRequired };
}
