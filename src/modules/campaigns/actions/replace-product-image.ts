import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Campaign, FinalRenderResult, ProductSnapshot } from "@/lib/types";
import { renderSkeleton } from "@/modules/email-templates";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import { buildBlueprint } from "@/modules/campaigns/utils/build-blueprint";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface ReplaceProductImageResult {
  status: "completed";
  renderResult: FinalRenderResult;
}

const UPLOADS_DIR = "uploads";

function inferExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1 || dot === filename.length - 1) return "jpg";
  return filename.slice(dot + 1).toLowerCase();
}

function safeSku(sku: string): string {
  return sku.replace(/[^a-zA-Z0-9_-]/g, "_");
}

// Fine-tune action — replace just the image of one product in the
// approved set. The operator might love the SKU but want a different
// photo (e.g. a lifestyle shot they already have on hand). approved-
// Products[i].imageUrl is updated to a fresh /uploads URL; the rest of
// the snapshot (name, price, link, etc.) is untouched.
export async function replaceProductImage(
  campaign: Campaign,
  sku: string,
  file: File,
): Promise<ReplaceProductImageResult> {
  if (!campaign.chosenSkeletonId) {
    throw new Error("Campaign has no chosenSkeletonId.");
  }
  if (!campaign.approvedCopy || !campaign.approvedProducts) {
    throw new Error("Campaign missing approved copy or products.");
  }
  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) {
    throw new Error(`Unknown chosenSkeletonId "${campaign.chosenSkeletonId}".`);
  }

  const idx = campaign.approvedProducts.findIndex((p) => p.sku === sku);
  if (idx === -1) {
    throw new Error(
      `No product with sku "${sku}" in approvedProducts. Found: ${campaign.approvedProducts
        .map((p) => p.sku)
        .join(", ")}`,
    );
  }

  const dir = join(process.cwd(), UPLOADS_DIR, campaign.id);
  await mkdir(dir, { recursive: true });

  const ext = inferExtension(file.name);
  const filename = `product-${safeSku(sku)}.${ext}`;
  const filepath = join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const newImageUrl = `/${UPLOADS_DIR}/${campaign.id}/${filename}`;
  const updatedProducts: ProductSnapshot[] = campaign.approvedProducts.map(
    (p, i) => (i === idx ? { ...p, imageUrl: newImageUrl } : p),
  );

  // Re-render with the patched product list so the operator sees the new
  // image on the next refresh without a separate render trigger.
  const blueprint = buildBlueprint({
    campaignId: campaign.id,
    seed: campaign.seed,
    approvedCopy: campaign.approvedCopy,
    approvedProducts: updatedProducts,
    assets: campaign.assetPaths ?? {},
  });
  const { html } = await renderSkeleton(skeleton, blueprint, {
    withAssets: true,
    blockOverrides: campaign.blockOverrides,
  });
  const renderResult: FinalRenderResult = {
    skeletonId: skeleton.id,
    html,
    renderedAt: new Date().toISOString(),
  };

  await updateCampaign(campaign.id, {
    approvedProducts: updatedProducts,
    renderResult,
    error: null,
  });

  return { status: "completed", renderResult };
}
