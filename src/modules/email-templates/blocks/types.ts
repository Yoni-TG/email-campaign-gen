// Per-block prop types + the BlockPropsMap that ties each BlockType to its
// component's prop shape. The renderer uses BlockPropsMap to resolve a
// manifest's bind paths into typed props for each component.

import type { BlockBackground } from "./theme";

// Matches the wire format used by CampaignBlueprint.products and the LLM
// copy/product agents — snake_case to stay consistent with the rest of the
// blueprint payload.
export interface BlueprintProduct {
  title: string;
  price: string;
  image_url: string;
  link: string;
}

export interface LogoHeaderProps {
  background?: BlockBackground;
}

export interface AnnouncementBarProps {
  text: string;
  background?: BlockBackground;
}

export interface HeroLifestyleProps {
  imageUrl: string;
  subLabel?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
}

export interface HeroProductProps {
  imageUrl: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
}

export interface HeroTypographyProps {
  topline?: string;
  headline: string;
  subhead?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
}

export interface HeroTileGraphicProps {
  subLabel?: string;
  headline: string;
  tiles: Array<{ label: string }>;
  urgency?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
}

export interface TextBlockCenteredProps {
  subLabel?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
}

export interface EditorialSplitProps {
  imageUrl: string;
  imageSide?: "left" | "right";
  subLabel?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
}

export interface ProductGridProps {
  products: BlueprintProduct[];
}

export interface NickyQuoteModuleProps {
  quote: string;
  response?: string | null;
  portraitUrl?: string;
  background?: BlockBackground;
}

export interface CtaButtonProps {
  label: string;
  href?: string;
  align?: "left" | "center";
}

export interface SectionLabelProps {
  text: string;
  align?: "left" | "center";
}

export interface ClosingBlockProps {
  imageUrl?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
}

export interface FooterProps {
  legalText?: string;
  background?: BlockBackground;
}

export interface BlockPropsMap {
  logo_header: LogoHeaderProps;
  announcement_bar: AnnouncementBarProps;
  hero_lifestyle: HeroLifestyleProps;
  hero_product: HeroProductProps;
  hero_typography: HeroTypographyProps;
  hero_tile_graphic: HeroTileGraphicProps;
  text_block_centered: TextBlockCenteredProps;
  editorial_split: EditorialSplitProps;
  product_grid_2x2: ProductGridProps;
  product_grid_3x2: ProductGridProps;
  product_grid_4x1: ProductGridProps;
  product_grid_magazine: ProductGridProps;
  nicky_quote_module: NickyQuoteModuleProps;
  cta_button: CtaButtonProps;
  section_label: SectionLabelProps;
  closing_block: ClosingBlockProps;
  footer: FooterProps;
}
