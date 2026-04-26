// Catalog of every atomic block rendered with realistic sample props plus
// any meaningful prop variants (e.g. logo_header background, editorial_split
// imageSide). Consumed by:
//   - /blocks app route          (src/app/blocks/page.tsx)
//   - the offline preview script (scripts/preview-blocks.tsx)
//
// To register a new block: add a BlockPreview entry below. The catalog
// surfaces it in both places without further wiring.

import * as React from "react";
import {
  AnnouncementBar,
  ClosingBlock,
  CtaButton,
  EditorialSplit,
  Footer,
  HeroLifestyle,
  HeroProduct,
  HeroTileGraphic,
  HeroTypography,
  LogoHeader,
  NickyQuoteModule,
  ProductGrid2x2,
  ProductGrid3x2,
  ProductGrid4x1,
  ProductGridMagazine,
  SectionLabel,
  TextBlockCentered,
} from "../blocks";
import { SAMPLE_HERO_URL, SAMPLE_PORTRAIT_URL, SAMPLE_PRODUCTS } from "./sample-data";

export interface BlockPreview {
  /** Stable slug for filenames + URL fragments. */
  id: string;
  /** Block type label (matches BLOCK_TYPES). Multiple previews share a label
   *  when a block has prop variants. */
  label: string;
  /** Optional one-line variant note. */
  variant?: string;
  /** Approximate render height for the iframe. */
  height: number;
  jsx: React.ReactElement;
}

export const BLOCK_PREVIEWS: BlockPreview[] = [
  {
    id: "logo-header-baby-blue",
    label: "logo_header",
    variant: "background: baby_blue (default)",
    height: 70,
    jsx: <LogoHeader />,
  },
  {
    id: "logo-header-white",
    label: "logo_header",
    variant: "background: white",
    height: 70,
    jsx: <LogoHeader background="white" />,
  },
  {
    id: "announcement-bar",
    label: "announcement_bar",
    height: 50,
    jsx: <AnnouncementBar text="FREE DELIVERY OVER $150" />,
  },
  {
    id: "section-label-center",
    label: "section_label",
    variant: "align: center",
    height: 50,
    jsx: <SectionLabel text="JEWELLERY FOR HER STORY" />,
  },
  {
    id: "section-label-left",
    label: "section_label",
    variant: "align: left",
    height: 50,
    jsx: <SectionLabel text="THE EDIT" align="left" />,
  },
  {
    id: "cta-button",
    label: "cta_button",
    height: 80,
    jsx: <CtaButton label="Shop the edit" href="#" />,
  },
  {
    id: "hero-lifestyle",
    label: "hero_lifestyle",
    height: 720,
    jsx: (
      <HeroLifestyle
        imageUrl={SAMPLE_HERO_URL}
        subLabel="NEW IN"
        headline="Made just for you"
        body="Personalised pieces ready to gift. Every initial, every birth stone, hand-finished and meant to be treasured."
        ctaLabel="Shop the edit"
        ctaHref="#"
      />
    ),
  },
  {
    id: "hero-product",
    label: "hero_product",
    height: 380,
    jsx: (
      <HeroProduct
        imageUrl={SAMPLE_PRODUCTS[0].image_url}
        headline="The Heart Pendant"
        body="Engraved with anything that matters — names, initials, dates."
        ctaLabel="Personalise yours"
        ctaHref="#"
      />
    ),
  },
  {
    id: "hero-typography-baby-blue",
    label: "hero_typography",
    variant: "background: baby_blue",
    height: 320,
    jsx: (
      <HeroTypography
        topline="LIMITED TIME"
        headline="20% off everything"
        subhead="Until midnight Sunday"
        ctaLabel="Shop now"
        ctaHref="#"
        background="baby_blue"
      />
    ),
  },
  {
    id: "hero-typography-white",
    label: "hero_typography",
    variant: "background: white",
    height: 320,
    jsx: (
      <HeroTypography
        topline="THE EDIT"
        headline="Spring in full bloom"
        subhead="A curated layering set"
        ctaLabel="Explore"
        ctaHref="#"
      />
    ),
  },
  {
    id: "hero-tile-graphic",
    label: "hero_tile_graphic",
    height: 480,
    jsx: (
      <HeroTileGraphic
        subLabel="YOUR MOMENT TO SHINE"
        headline="Mystery Sale"
        tiles={[{ label: "$" }, { label: "?" }, { label: "%" }]}
        urgency="TODAY ONLY"
        body="Treat yourself to the ultimate secret surprise. A special offer waiting just for you."
        ctaLabel="Reveal your offer"
        ctaHref="#"
      />
    ),
  },
  {
    id: "text-block-centered",
    label: "text_block_centered",
    height: 320,
    jsx: (
      <TextBlockCentered
        subLabel="DID YOU KNOW"
        headline="Our diamonds are lab-grown"
        body="Every stone is responsibly created in a lab — same beauty, same fire, kinder to the planet."
        ctaLabel="Read more"
        ctaHref="#"
      />
    ),
  },
  {
    id: "editorial-split-left",
    label: "editorial_split",
    variant: "imageSide: left",
    height: 360,
    jsx: (
      <EditorialSplit
        imageUrl={SAMPLE_HERO_URL}
        imageSide="left"
        subLabel="HOW TO WEAR"
        headline="Layer the look"
        body="Mix metal with bone. Anchor a stack with a single statement piece."
        ctaLabel="See the styling"
        ctaHref="#"
      />
    ),
  },
  {
    id: "editorial-split-right",
    label: "editorial_split",
    variant: "imageSide: right",
    height: 360,
    jsx: (
      <EditorialSplit
        imageUrl={SAMPLE_HERO_URL}
        imageSide="right"
        subLabel="THE STORY"
        headline="Made to be treasured"
        body="Hand-finished, individually inspected, ready to gift."
        ctaLabel="Read the story"
        ctaHref="#"
      />
    ),
  },
  {
    id: "product-grid-2x2",
    label: "product_grid_2x2",
    height: 720,
    jsx: <ProductGrid2x2 products={SAMPLE_PRODUCTS} />,
  },
  {
    id: "product-grid-3x2",
    label: "product_grid_3x2",
    height: 540,
    jsx: <ProductGrid3x2 products={SAMPLE_PRODUCTS} />,
  },
  {
    id: "product-grid-4x1",
    label: "product_grid_4x1",
    height: 240,
    jsx: <ProductGrid4x1 products={SAMPLE_PRODUCTS} />,
  },
  {
    id: "product-grid-magazine",
    label: "product_grid_magazine",
    height: 620,
    jsx: <ProductGridMagazine products={SAMPLE_PRODUCTS} />,
  },
  {
    id: "nicky-quote-with-portrait",
    label: "nicky_quote_module",
    variant: "with portrait",
    height: 240,
    jsx: (
      <NickyQuoteModule
        quote="These are the pieces I'd give my own mom — and I do."
        response="Thank you Nicky!"
        portraitUrl={SAMPLE_PORTRAIT_URL}
      />
    ),
  },
  {
    id: "nicky-quote-no-portrait",
    label: "nicky_quote_module",
    variant: "no portrait",
    height: 220,
    jsx: (
      <NickyQuoteModule
        quote="A piece of jewellery says what words can't quite reach."
        response={null}
      />
    ),
  },
  {
    id: "closing-block-with-image",
    label: "closing_block",
    variant: "with imageUrl",
    height: 600,
    jsx: (
      <ClosingBlock
        imageUrl={SAMPLE_HERO_URL}
        headline="The Season to Shine"
        body="Daintily layered, deeply meaningful."
        ctaLabel="Find your piece"
        ctaHref="#"
      />
    ),
  },
  {
    id: "closing-block-text-only",
    label: "closing_block",
    variant: "no imageUrl",
    height: 280,
    jsx: (
      <ClosingBlock
        headline="Don't miss out"
        body="The edit is curated and limited — until it's gone."
        ctaLabel="Shop the edit"
        ctaHref="#"
      />
    ),
  },
  {
    id: "footer",
    label: "footer",
    height: 280,
    jsx: <Footer />,
  },
];
