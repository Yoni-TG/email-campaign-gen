import type { Prisma } from "@prisma/client";
import { prisma, parseCampaign } from "@/lib/db";
import type {
  ApprovedCopy,
  Campaign,
  CampaignStatus,
  CampaignType,
  CandidateVariant,
  CreativeSeed,
  FinalRenderResult,
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
  assetPaths?: Record<string, string> | null;
  blockOverrides?: Record<number, Record<string, unknown>> | null;
  blockOrder?: number[] | null;
  candidateVariants?: CandidateVariant[] | null;
  chosenSkeletonId?: string | null;
  renderResult?: FinalRenderResult | null;
  error?: string | null;
  /** Pass a Date to archive, null to unarchive. */
  archivedAt?: Date | null;
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
  if (data.chosenSkeletonId !== undefined)
    out.chosenSkeletonId = data.chosenSkeletonId;
  if (data.error !== undefined) out.error = data.error;
  if (data.archivedAt !== undefined) out.archivedAt = data.archivedAt;

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
  if (data.assetPaths !== undefined)
    out.assetPaths = data.assetPaths
      ? JSON.stringify(data.assetPaths)
      : null;
  if (data.blockOverrides !== undefined)
    out.blockOverrides = data.blockOverrides
      ? JSON.stringify(data.blockOverrides)
      : null;
  if (data.blockOrder !== undefined)
    out.blockOrder = data.blockOrder ? JSON.stringify(data.blockOrder) : null;
  if (data.candidateVariants !== undefined)
    out.candidateVariants = data.candidateVariants
      ? JSON.stringify(data.candidateVariants)
      : null;
  if (data.renderResult !== undefined)
    out.renderResult = data.renderResult
      ? JSON.stringify(data.renderResult)
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

// Row shape for list views — skips the heaviest JSON blobs (generatedCopy,
// approvedCopy, products, render artefacts) that the home page doesn't need
// to render. We do load `seed` so the row can show the operator-written
// `mainMessage` as a one-line teaser; seed is small so the cost is fine at
// human-team scale.
export interface CampaignSummary {
  id: string;
  name: string;
  status: CampaignStatus;
  campaignType: CampaignType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  /** First-line teaser pulled from seed.mainMessage. Empty string when missing. */
  teaser: string;
}

export type ListScope = "active" | "archived" | "all";

// `archivedAt` is the only DB-side filter the list cares about. The
// rest (search / type / status / sort direction) are applied in-memory
// against the returned summaries — at human-team scale (low thousands)
// the round-trip + JSON parse cost dwarfs any client-side iteration,
// and keeping it server-component-friendly avoids two query paths.
export async function listCampaignSummaries(
  scope: ListScope = "active",
): Promise<CampaignSummary[]> {
  const where =
    scope === "active"
      ? { archivedAt: null }
      : scope === "archived"
        ? { NOT: { archivedAt: null } }
        : {};
  const rows = await prisma.campaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      campaignType: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      archivedAt: true,
      seed: true,
    },
  });
  return rows.map(({ seed, ...row }) => ({
    ...row,
    status: row.status as CampaignStatus,
    campaignType: row.campaignType as CampaignType,
    teaser: extractTeaser(seed),
  }));
}

// Pulls the operator's `mainMessage` out of the JSON-stringified seed
// blob. Defensive: a malformed or missing seed yields an empty teaser
// rather than throwing — list rendering must never fail on one bad row.
function extractTeaser(seed: string): string {
  try {
    const parsed = JSON.parse(seed) as { mainMessage?: unknown };
    return typeof parsed.mainMessage === "string" ? parsed.mainMessage : "";
  } catch {
    return "";
  }
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
