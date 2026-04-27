import { PrismaClient, Campaign as DbCampaign } from "@prisma/client";
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

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// SQLite stores our JSON blobs as strings. parseCampaign deserializes a DB row
// into the domain Campaign type. When the schema moves to Postgres and the
// columns become Json, this helper becomes a pass-through.
export function parseCampaign(row: DbCampaign): Campaign {
  return {
    id: row.id,
    name: row.name,
    status: row.status as CampaignStatus,
    campaignType: row.campaignType as CampaignType,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    seed: JSON.parse(row.seed) as CreativeSeed,
    generatedCopy: row.generatedCopy
      ? (JSON.parse(row.generatedCopy) as GeneratedCopy)
      : null,
    approvedCopy: row.approvedCopy
      ? (JSON.parse(row.approvedCopy) as ApprovedCopy)
      : null,
    generatedProducts: row.generatedProducts
      ? (JSON.parse(row.generatedProducts) as ProductSnapshot[])
      : null,
    approvedProducts: row.approvedProducts
      ? (JSON.parse(row.approvedProducts) as ProductSnapshot[])
      : null,
    heroImagePath: row.heroImagePath,
    assetPaths: row.assetPaths
      ? (JSON.parse(row.assetPaths) as Record<string, string>)
      : null,
    blockOverrides: row.blockOverrides
      ? (JSON.parse(row.blockOverrides) as Record<
          number,
          Record<string, unknown>
        >)
      : null,
    candidateVariants: row.candidateVariants
      ? (JSON.parse(row.candidateVariants) as CandidateVariant[])
      : null,
    chosenSkeletonId: row.chosenSkeletonId,
    renderResult: row.renderResult
      ? (JSON.parse(row.renderResult) as FinalRenderResult)
      : null,
    error: row.error,
    archivedAt: row.archivedAt,
  };
}
