#!/usr/bin/env tsx
/**
 * Renders every atomic block in isolation (no skeleton, no surrounding
 * email layout) so you can eyeball each component standalone. Useful for
 * design review of individual blocks without distractions.
 *
 * Each block is rendered with realistic sample props, and where a block
 * has meaningful variants (e.g. logo_header background), each variant
 * gets its own preview tile.
 *
 *   npx tsx scripts/preview-blocks.ts
 *
 * Output: out/block-previews/index.html — a single page that embeds each
 * block's HTML in a labelled iframe.
 */

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as React from "react";
import { Body, Container, Head, Html } from "@react-email/components";
import { render } from "@react-email/render";
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
} from "@/modules/email-templates/blocks";
import { COLORS } from "@/modules/email-templates/blocks/theme";
import type { BlueprintProduct } from "@/modules/email-templates/blocks/types";

const OUT_DIR = "out/block-previews";

const SAMPLE_HERO = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=640";
const SAMPLE_PORTRAIT = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200";

const SAMPLE_PRODUCTS: BlueprintProduct[] = [
  { title: "Heart Pendant", price: "$98", image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300", link: "#" },
  { title: "Stack Ring Set", price: "$76", image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300", link: "#" },
  { title: "Birth Stone Bracelet", price: "$112", image_url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300", link: "#" },
  { title: "Initial Necklace", price: "$84", image_url: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=300", link: "#" },
  { title: "Pearl Studs", price: "$68", image_url: "https://images.unsplash.com/photo-1535632066274-36ee5b30b859?w=300", link: "#" },
  { title: "Charm Anklet", price: "$58", image_url: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=300", link: "#" },
];

interface BlockPreview {
  /** Stable slug for filenames. */
  id: string;
  /** Human label shown in the catalog. */
  label: string;
  /** Optional variant note when a block has multiple previews. */
  variant?: string;
  /** Approximate render height for the iframe. */
  height: number;
  jsx: React.ReactElement;
}

const PREVIEWS: BlockPreview[] = [
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
        imageUrl={SAMPLE_HERO}
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
        imageUrl={SAMPLE_HERO}
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
        imageUrl={SAMPLE_HERO}
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
        portraitUrl={SAMPLE_PORTRAIT}
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
        imageUrl={SAMPLE_HERO}
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

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function renderBlockToHtml(block: React.ReactElement): Promise<string> {
  const tree = (
    <Html>
      <Head />
      <Body style={{ backgroundColor: COLORS.white, margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            backgroundColor: COLORS.white,
          }}
        >
          {block}
        </Container>
      </Body>
    </Html>
  );
  return render(tree, { pretty: false });
}

async function main() {
  const dir = join(process.cwd(), OUT_DIR);
  await mkdir(dir, { recursive: true });
  console.log(`Rendering ${PREVIEWS.length} block previews → ${dir}/`);

  for (const preview of PREVIEWS) {
    const html = await renderBlockToHtml(preview.jsx);
    await writeFile(join(dir, `${preview.id}.html`), html, "utf8");
    console.log(`  ✓ ${preview.label}${preview.variant ? ` (${preview.variant})` : ""}`);
  }

  // Group by block label so the catalog clusters variants of the same block.
  const grouped = new Map<string, BlockPreview[]>();
  for (const p of PREVIEWS) {
    if (!grouped.has(p.label)) grouped.set(p.label, []);
    grouped.get(p.label)!.push(p);
  }

  const sections = Array.from(grouped.entries())
    .map(
      ([label, items]) => `
        <section class="block-group">
          <h2>${escape(label)}</h2>
          ${items
            .map(
              (i) => `
                <div class="preview-tile">
                  ${i.variant ? `<p class="variant">${escape(i.variant)}</p>` : ""}
                  <iframe
                    src="${escape(i.id)}.html"
                    style="width:100%;height:${i.height}px"
                    title="${escape(i.id)}"
                  ></iframe>
                </div>`,
            )
            .join("")}
        </section>`,
    )
    .join("");

  const indexHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Theo Grace · Block Catalog</title>
  <style>
    body {
      font-family: -apple-system, system-ui, sans-serif;
      background: #fafafa;
      margin: 0;
      padding: 24px;
      color: #1E1E1E;
    }
    h1 {
      font-family: Georgia, serif;
      font-size: 24px;
      margin: 0 0 4px;
    }
    .lede {
      color: #666;
      font-size: 13px;
      margin: 0 0 32px;
    }
    .block-group {
      margin-bottom: 48px;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 20px;
    }
    .block-group h2 {
      font-family: ui-monospace, "SF Mono", monospace;
      font-size: 13px;
      color: #444;
      margin: 0 0 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    .preview-tile {
      margin-bottom: 24px;
    }
    .preview-tile:last-child { margin-bottom: 0; }
    .variant {
      font-size: 11px;
      color: #888;
      margin: 0 0 6px;
      font-family: ui-monospace, "SF Mono", monospace;
    }
    iframe {
      border: 1px solid #eee;
      background: #fff;
      display: block;
      max-width: 640px;
    }
  </style>
</head>
<body>
  <h1>Block Catalog</h1>
  <p class="lede">${PREVIEWS.length} previews across ${grouped.size} block types. Each tile is the block in isolation — no skeleton, no surrounding email layout.</p>
  ${sections}
</body>
</html>`;

  await writeFile(join(dir, "index.html"), indexHtml, "utf8");
  console.log(`\nDone. Open file://${join(dir, "index.html")} in a browser.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
