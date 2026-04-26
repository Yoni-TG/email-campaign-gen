// Per-block prop types + the BlockPropsMap that ties each BlockType to its
// component's prop shape. The renderer uses BlockPropsMap to resolve a
// manifest's bind paths into typed props for each component.

import type { BlockBackground } from "./theme";

// When the renderer runs in editable mode it derives a map from each
// bindable prop to a `data-edit-target` string and passes it to the
// block. Blocks then place the attribute on the visible element that
// renders that prop. A missing entry just means "this prop isn't
// editable" — the attribute is omitted, and clicks on that element
// behave normally.
type EditTargets = Record<string, string>;

// Matches the wire format used by CampaignBlueprint.products and the LLM
// copy/product agents — snake_case to stay consistent with the rest of the
// blueprint payload. `sku` is carried through so the editable renderer can
// emit per-product edit targets that the fine-tune endpoints can resolve
// back to the right approvedProducts row.
export interface BlueprintProduct {
  sku: string;
  title: string;
  price: string;
  image_url: string;
  link: string;
}

export interface LogoHeaderProps {
  background?: BlockBackground;
  editTargets?: EditTargets;
}

export interface AnnouncementBarProps {
  text: string;
  background?: BlockBackground;
  editTargets?: EditTargets;
}

export interface HeroLifestyleProps {
  imageUrl: string;
  subLabel?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
  editTargets?: EditTargets;
}

export interface HeroFramedProps {
  imageUrl: string;
  subLabel?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
  editTargets?: EditTargets;
}

export interface HeroProductProps {
  imageUrl: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
  editTargets?: EditTargets;
}

export interface HeroTypographyProps {
  topline?: string;
  headline: string;
  subhead?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
  editTargets?: EditTargets;
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
  editTargets?: EditTargets;
}

export interface TextBlockCenteredProps {
  subLabel?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
  editTargets?: EditTargets;
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
  editTargets?: EditTargets;
}

export interface ProductGridProps {
  products: BlueprintProduct[];
  editTargets?: EditTargets;
}

export interface NickyQuoteModuleProps {
  quote: string;
  response?: string | null;
  portraitUrl?: string;
  background?: BlockBackground;
  editTargets?: EditTargets;
}

export interface CtaButtonProps {
  label: string;
  href?: string;
  align?: "left" | "center";
  /** Optional click-to-edit target. When set, the button becomes
   *  editable on the in-app editing surface. */
  editTarget?: string;
}

export interface SectionLabelProps {
  text: string;
  align?: "left" | "center";
  editTarget?: string;
}

export interface ClosingBlockProps {
  imageUrl?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  background?: BlockBackground;
  editTargets?: EditTargets;
}

export interface FooterProps {
  legalText?: string;
  background?: BlockBackground;
  editTargets?: EditTargets;
}

export interface BlockPropsMap {
  logo_header: LogoHeaderProps;
  announcement_bar: AnnouncementBarProps;
  hero_lifestyle: HeroLifestyleProps;
  hero_framed: HeroFramedProps;
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
