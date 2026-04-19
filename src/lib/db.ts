import { PrismaClient, Campaign as DbCampaign } from "@prisma/client";
import type {
  Campaign,
  CampaignStatus,
  CampaignType,
  CreativeSeed,
  GeneratedCopy,
  ApprovedCopy,
  ProductSnapshot,
  FigmaResult,
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
    figmaResult: row.figmaResult
      ? (JSON.parse(row.figmaResult) as FigmaResult)
      : null,
    error: row.error,
  };
}
