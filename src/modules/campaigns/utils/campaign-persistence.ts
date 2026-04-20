import type { Prisma } from "@prisma/client";
import { prisma, parseCampaign } from "@/lib/db";
import type {
  ApprovedCopy,
  Campaign,
  CampaignStatus,
  CampaignType,
  CreativeSeed,
  FigmaResult,
  GeneratedCopy,
  ProductSnapshot,
} from "@/lib/types";

// Fields the API layer can write. Domain-shaped — JSON stringification happens
// once, inside serializeForDb, so no route or action ever hand-rolls it.
export interface CampaignWrite {
  name?: string;
  status?: CampaignStatus;
  campaignType?: CampaignType;
  createdBy?: string;
  seed?: CreativeSeed;
  generatedCopy?: GeneratedCopy | null;
  approvedCopy?: ApprovedCopy | null;
  generatedProducts?: ProductSnapshot[] | null;
  approvedProducts?: ProductSnapshot[] | null;
  heroImagePath?: string | null;
  figmaResult?: FigmaResult | null;
  error?: string | null;
}

export function serializeForDb(
  data: CampaignWrite,
): Prisma.CampaignUncheckedUpdateInput {
  const out: Prisma.CampaignUncheckedUpdateInput = {};

  if (data.name !== undefined) out.name = data.name;
  if (data.status !== undefined) out.status = data.status;
  if (data.campaignType !== undefined) out.campaignType = data.campaignType;
  if (data.createdBy !== undefined) out.createdBy = data.createdBy;
  if (data.heroImagePath !== undefined) out.heroImagePath = data.heroImagePath;
  if (data.error !== undefined) out.error = data.error;

  if (data.seed !== undefined) out.seed = JSON.stringify(data.seed);
  if (data.generatedCopy !== undefined)
    out.generatedCopy = data.generatedCopy
      ? JSON.stringify(data.generatedCopy)
      : null;
  if (data.approvedCopy !== undefined)
    out.approvedCopy = data.approvedCopy
      ? JSON.stringify(data.approvedCopy)
      : null;
  if (data.generatedProducts !== undefined)
    out.generatedProducts = data.generatedProducts
      ? JSON.stringify(data.generatedProducts)
      : null;
  if (data.approvedProducts !== undefined)
    out.approvedProducts = data.approvedProducts
      ? JSON.stringify(data.approvedProducts)
      : null;
  if (data.figmaResult !== undefined)
    out.figmaResult = data.figmaResult
      ? JSON.stringify(data.figmaResult)
      : null;

  return out;
}

export interface CreateCampaignInput {
  name: string;
  campaignType: CampaignType;
  createdBy: string;
  seed: CreativeSeed;
}

export async function createCampaign(
  input: CreateCampaignInput,
): Promise<Campaign> {
  const row = await prisma.campaign.create({
    data: {
      name: input.name,
      campaignType: input.campaignType,
      createdBy: input.createdBy,
      seed: JSON.stringify(input.seed),
      status: "draft",
    },
  });
  return parseCampaign(row);
}

export async function listCampaigns(): Promise<Campaign[]> {
  const rows = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(parseCampaign);
}

// Row shape for list views — skips the heavy JSON blobs (seed, generatedCopy,
// products, figma) that the home page doesn't need to render.
export interface CampaignSummary {
  id: string;
  name: string;
  status: CampaignStatus;
  campaignType: CampaignType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function listCampaignSummaries(): Promise<CampaignSummary[]> {
  const rows = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      campaignType: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return rows.map((row) => ({
    ...row,
    status: row.status as CampaignStatus,
    campaignType: row.campaignType as CampaignType,
  }));
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const row = await prisma.campaign.findUnique({ where: { id } });
  return row ? parseCampaign(row) : null;
}

export async function updateCampaign(
  id: string,
  data: CampaignWrite,
): Promise<Campaign> {
  const row = await prisma.campaign.update({
    where: { id },
    data: serializeForDb(data),
  });
  return parseCampaign(row);
}
