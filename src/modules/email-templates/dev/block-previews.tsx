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
  HeroFramed,
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
    id: "hero-framed-baby-blue",
    label: "hero_framed",
    variant: "background: baby_blue (default)",
    height: 700,
    jsx: (
      <HeroFramed
        imageUrl={SAMPLE_HERO_URL}
        subLabel="MADE TO TREASURE"
        headline="A love story, pinned close"
        body="A meaningful piece created to celebrate family, memory, and the moments that shape us."
        ctaLabel="Shop Now"
        ctaHref="#"
      />
    ),
  },
  {
    id: "hero-framed-pale-blue",
    label: "hero_framed",
    variant: "background: pale_blue",
    height: 700,
    jsx: (
      <HeroFramed
        imageUrl={SAMPLE_HERO_URL}
        subLabel="THE COLLECTION"
        headline="The Sweetheart Brooch"
        body="Hand-finished and made to be passed on."
        ctaLabel="Discover the piece"
        ctaHref="#"
        background="pale_blue"
      />
    ),
  },
  {
    id: "hero-product-pale-blue",
    label: "hero_product",
    variant: "background: pale_blue (default)",
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
    id: "hero-product-white",
    label: "hero_product",
    variant: "background: white",
    height: 380,
    jsx: (
      <HeroProduct
        imageUrl={SAMPLE_PRODUCTS[0].image_url}
        headline="The Heart Pendant"
        body="Engraved with anything that matters — names, initials, dates."
        ctaLabel="Personalise yours"
        ctaHref="#"
        background="white"
      />
    ),
  },
  {
    id: "hero-product-baby-blue",
    label: "hero_product",
    variant: "background: baby_blue",
    height: 380,
    jsx: (
      <HeroProduct
        imageUrl={SAMPLE_PRODUCTS[0].image_url}
        headline="The Heart Pendant"
        body="Engraved with anything that matters — names, initials, dates."
        ctaLabel="Personalise yours"
        ctaHref="#"
        background="baby_blue"
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
    id: "text-block-centered-white",
    label: "text_block_centered",
    variant: "background: white (default)",
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
    id: "text-block-centered-baby-blue",
    label: "text_block_centered",
    variant: "background: baby_blue",
    height: 320,
    jsx: (
      <TextBlockCentered
        subLabel="DID YOU KNOW"
        headline="Our diamonds are lab-grown"
        body="Every stone is responsibly created in a lab — same beauty, same fire, kinder to the planet."
        ctaLabel="Read more"
        ctaHref="#"
        background="baby_blue"
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
    variant: "with portrait, pale_blue (default)",
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
    variant: "no portrait, background: white",
    height: 220,
    jsx: (
      <NickyQuoteModule
        quote="A piece of jewellery says what words can't quite reach."
        response={null}
        background="white"
      />
    ),
  },
  {
    id: "nicky-quote-baby-blue",
    label: "nicky_quote_module",
    variant: "background: baby_blue",
    height: 240,
    jsx: (
      <NickyQuoteModule
        quote="Joy is the smallest beautiful thing — and we make a lot of those."
        response={null}
        portraitUrl={SAMPLE_PORTRAIT_URL}
        background="baby_blue"
      />
    ),
  },
  {
    id: "closing-block-with-image",
    label: "closing_block",
    variant: "with imageUrl, baby_blue (default)",
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
    id: "closing-block-text-pale-blue",
    label: "closing_block",
    variant: "no image, background: pale_blue",
    height: 280,
    jsx: (
      <ClosingBlock
        headline="Don't miss out"
        body="The edit is curated and limited — until it's gone."
        ctaLabel="Shop the edit"
        ctaHref="#"
        background="pale_blue"
      />
    ),
  },
  {
    id: "closing-block-text-white",
    label: "closing_block",
    variant: "no image, background: white",
    height: 280,
    jsx: (
      <ClosingBlock
        headline="One last thought"
        body="Curated, considered, and made to last."
        ctaLabel="Browse all"
        ctaHref="#"
        background="white"
      />
    ),
  },
  {
    id: "footer",
    label: "footer",
    height: 880,
    jsx: <Footer />,
  },
  {
    id: "footer-no-disclaimer",
    label: "footer",
    variant: "disclaimer hidden (editorial sends)",
    height: 760,
    jsx: <Footer disclaimer={null} />,
  },
];
