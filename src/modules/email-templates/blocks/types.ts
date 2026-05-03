// Per-block prop types + the BlockPropsMap that ties each BlockType to its
// component's prop shape. The renderer uses BlockPropsMap to resolve a
// manifest's bind paths into typed props for each component.

import type { BlockAlignment, BlockBackground, ButtonColor } from "./theme";

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
  /** Operator-uploaded GIF or image (600 × 310 px recommended, 2:1 ratio). */
  imageUrl: string;
  ctaHref?: string;
  editTargets?: EditTargets;
}

export interface HeroTitledImageProps {
  imageUrl: string;
  subLabel?: string;
  headline: string;
  background?: BlockBackground;
  /**
   * Where the headline sits relative to the image. Default `above` places
   * the headline in a coloured panel directly above the image (the
   * Mother's-Day-Last-Call build). `overlay-bottom` absolute-positions
   * the headline over the lower-center of the image in white serif —
   * Outlook desktop ignores absolute positioning, so the headline falls
   * back to a panel below the image (graceful degradation).
   */
  titlePosition?: "above" | "overlay-bottom";
  editTargets?: EditTargets;
}

export interface HeroOfferOverlayProps {
  imageUrl: string;
  /** Top-region title (italic serif). e.g. "Last Call!" */
  topline?: string;
  /** Optional second line of the top title. e.g. "Free Mother's Day Shipping!" */
  subline?: string;
  /** Italic intro above the offer numerals. e.g. "Final Hours!" */
  offerTopline?: string;
  /** Huge offer numerals — the visual anchor. e.g. "25% OFF" */
  offerHeadline: string;
  /** Italic descriptor below the numerals. e.g. "sitewide" */
  offerSubhead?: string;
  /** Promo code rendered as a white pill chip. e.g. "Use code: MOM25" */
  code?: string;
  ctaLabel?: string;
  ctaHref?: string;
  editTargets?: EditTargets;
}

export interface OfferPanelProps {
  /** Small italic intro line. e.g. "Last Chance to shop the Perfect Gift for Mom". */
  topline?: string;
  /** Huge offer numerals — the visual anchor. e.g. "$30 OFF". */
  headline: string;
  /** Italic descriptor below the offer. e.g. "everything". */
  subhead?: string;
  /** Promo code rendered as a darker pill chip. e.g. "Use code: MOM30". */
  code?: string;
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
  align?: BlockAlignment;
  buttonColor?: ButtonColor;
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
  /** Slice start; defaults to 0. Used by skeletons that stack multiple
   *  grids over one products array (e.g. three labelled tiers of 3). */
  offset?: number;
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
  align?: BlockAlignment;
  buttonColor?: ButtonColor;
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

/**
 * One persistent footer used across every Theo Grace email. Six
 * vertical strips:
 *   1. "The Theo Grace Experience" composite (title + 4 USP icons)
 *   2. "As Seen On" composite (title + 6 press logos)
 *   3. Social icon row (Facebook / Instagram / TikTok / Pinterest)
 *   4. Optional disclaimer (limited-time / promo terms)
 *   5. theo grace wordmark
 *   6. Unsubscribe + Privacy + Copyright + address
 *
 * All strips render in the same component because the operator never
 * needs to compose them differently on a per-campaign basis. The
 * Experience and As-Seen-On strips are rendered from single brand-
 * supplied composite images (see src/modules/email-templates/assets/),
 * so the title text + icons + labels all live in the asset rather
 * than as separate React elements.
 */
export interface FooterProps {
  /** Path / URL to the Experience composite image. */
  experienceImageUrl?: string;
  /** Path / URL to the As Seen On composite image. */
  pressLogosImageUrl?: string;
  /** Limited-time-offer disclaimer. Pass null to hide the strip. */
  disclaimer?: string | null;
  /** Optional Theo Grace wordmark image. Falls back to text rendered in FONTS.display. */
  logoImageUrl?: string;
  /** Privacy Policy link target. Defaults to https://theograce.com/privacy. */
  privacyHref?: string;
  /** Postal address shown in the legal strip. */
  address?: string;
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
  hero_titled_image: HeroTitledImageProps;
  hero_offer_overlay: HeroOfferOverlayProps;
  offer_panel: OfferPanelProps;
  text_block_centered: TextBlockCenteredProps;
  editorial_split: EditorialSplitProps;
  product_grid_2x2: ProductGridProps;
  product_grid_3x2: ProductGridProps;
  product_grid_3x1: ProductGridProps;
  product_grid_4x1: ProductGridProps;
  product_grid_magazine: ProductGridProps;
  product_grid_split: ProductGridProps;
  product_grid_best_sellers: ProductGridProps;
  nicky_quote_module: NickyQuoteModuleProps;
  cta_button: CtaButtonProps;
  section_label: SectionLabelProps;
  closing_block: ClosingBlockProps;
  footer: FooterProps;
}
