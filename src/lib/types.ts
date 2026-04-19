// ─── Campaign Status ───

export const CAMPAIGN_STATUSES = [
  "draft",
  "generating",
  "review",
  "hero_upload",
  "filling_figma",
  "variant_selection",
  "completed",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

// ─── Campaign Types ───

export const CAMPAIGN_TYPES = [
  "product_launch",
  "sale_promo",
  "editorial",
  "collection_spotlight",
  "holiday_seasonal",
] as const;

export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  product_launch: "Product Launch",
  sale_promo: "Sale / Promo",
  editorial: "Editorial",
  collection_spotlight: "Collection Spotlight",
  holiday_seasonal: "Holiday / Seasonal",
};

// ─── Creative Seed ───

export interface CreativeSeed {
  targetCategories: string[];
  promoDetails?: string;
  mainMessage: string;
  secondaryMessage?: string;
  pinnedSkus?: string[];
  milledInspirationUrls?: string[];
  additionalNotes?: string;
  includeSms: boolean;
}

// ─── Generated Copy ───

export interface GeneratedCopy {
  subjectLines: string[];
  preHeader: string;
  hero: {
    title: string;
    subtitle: string;
    paragraph: string;
  };
  secondary: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  primaryCtaText: string;
  smsCopy?: string;
}

// ─── Approved Copy ───

export interface ApprovedCopy {
  subjectLine: string;
  preHeader: string;
  hero: {
    title: string;
    subtitle: string;
    paragraph: string;
  };
  secondary: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  primaryCtaText: string;
  smsCopy?: string;
}

// ─── Product Snapshot ───

export interface ProductSnapshot {
  sku: string;
  name: string;
  imageUrl: string;
  price: string;
  salePrice: string;
  currency: string;
  link: string;
  productType: string[];
}

// ─── Feed Product (raw from Notch JSON) ───

export interface FeedProduct {
  SKU: string;
  Name: string;
  Description: string;
  "product type": string[];
  "Shop for": string[];
  Occasion: string[];
  Collection: string[];
  material: string[];
  "metal color": string;
  "Out of Stock (Stock/OOS)": string;
  Price: string;
  "Sale Price": string;
  currency: string;
  link: string;
  "Review Count": string;
  "Review Rate": string;
  [key: string]: unknown;
}

// ─── Figma ───

export interface FigmaVariant {
  variantName: string;
  figmaFrameUrl: string;
  thumbnailUrl: string;
}

export interface FigmaResult {
  variants: FigmaVariant[];
  selectedVariant?: string;
}

export interface CampaignBlueprint {
  campaignId: string;
  hero: {
    title: string;
    subtitle: string;
    paragraph: string;
    imageUrl: string;
  };
  secondary: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  primaryCtaText: string;
  products: Array<{
    title: string;
    price: string;
    imageUrl: string;
    link: string;
  }>;
}

// ─── Figma Service Interface ───

export interface FigmaTemplate {
  id: string;
  name: string;
}

export interface FilledVariant {
  variantName: string;
  figmaFrameUrl: string;
}

export interface FigmaService {
  getAvailableTemplates(): Promise<FigmaTemplate[]>;
  fillTemplates(blueprint: CampaignBlueprint): Promise<FilledVariant[]>;
  exportThumbnails(variants: FilledVariant[]): Promise<string[]>;
}

// ─── Campaign (full record, as returned from DB) ───

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  campaignType: CampaignType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  seed: CreativeSeed;
  generatedCopy: GeneratedCopy | null;
  approvedCopy: ApprovedCopy | null;
  generatedProducts: ProductSnapshot[] | null;
  approvedProducts: ProductSnapshot[] | null;
  heroImagePath: string | null;
  figmaResult: FigmaResult | null;
  error: string | null;
}
