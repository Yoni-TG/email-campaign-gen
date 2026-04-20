import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Campaign } from "@/lib/types";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface HeroUploadResult {
  status: "filling_figma";
  heroImagePath: string;
}

const UPLOADS_DIR = "uploads";

function inferExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1 || dot === filename.length - 1) return "jpg";
  return filename.slice(dot + 1).toLowerCase();
}

export async function uploadHero(
  campaign: Campaign,
  file: File,
): Promise<HeroUploadResult> {
  const dir = join(process.cwd(), UPLOADS_DIR, campaign.id);
  await mkdir(dir, { recursive: true });

  const ext = inferExtension(file.name);
  const filename = `hero.${ext}`;
  const filepath = join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  const heroImagePath = `/${UPLOADS_DIR}/${campaign.id}/${filename}`;

  await updateCampaign(campaign.id, {
    heroImagePath,
    status: "filling_figma",
  });

  return { status: "filling_figma", heroImagePath };
}
