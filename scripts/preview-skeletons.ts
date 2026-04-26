#!/usr/bin/env tsx
/**
 * Renders every skeleton in the library to HTML files and writes an index
 * page that links to each. Run from the repo root:
 *
 *   npx tsx scripts/preview-skeletons.ts
 *
 * Output: out/skeleton-previews/{<id>.html, index.html}. Open index.html in
 * a browser to flip through the catalog.
 *
 * Sample blueprint mirrors the skeletons.test.ts fixture — placeholder hero
 * URLs are used so you can see the asset slots in context. Pass --withAssets
 * to swap placeholders for real sample images.
 */

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderSkeleton } from "@/modules/email-templates";
import { loadAllSkeletons } from "@/modules/email-templates/skeletons";
import type { CampaignBlueprint } from "@/lib/types";

const OUT_DIR = "out/skeleton-previews";

const SAMPLE_HERO = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=640";
const SAMPLE_CLOSING = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=640";
const SAMPLE_SECONDARY = "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=640";
const SAMPLE_PORTRAIT = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200";

function sampleBlueprint(withAssets: boolean): CampaignBlueprint {
  return {
    campaign_id: "cmp_preview",
    lead_value: "joy",
    lead_personalities: ["fun", "warm_hearted"],
    market: "us",
    free_top_text: "FREE DELIVERY",
    subject_variant: {
      subject: "Say it with meaning",
      preheader: "From Theo Grace, with love.",
    },
    body_blocks: [
      {
        title: "Made just for you",
        description:
          "Personalised pieces ready to gift. Every initial, every birth stone, hand-finished and meant to be treasured.",
        cta: "Shop the edit",
      },
      {
        title: "Every piece, a story",
        description:
          "Layered for the school run, dressed up for the occasion. Made to be worn, made to be loved.",
        cta: "Find your piece",
      },
      {
        title: "Almost gone",
        description: "Last call before they're back to the workshop.",
        cta: "Catch them",
      },
    ],
    sms: "Theo Grace: 20% off your first piece. {link}",
    nicky_quote: {
      quote: "These are the pieces I'd give my own mom — and I do.",
      response: "Thank you Nicky!",
    },
    products: [
      { title: "Heart Pendant", price: "$98", image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300", link: "https://theograce.com/p/1" },
      { title: "Stack Ring Set", price: "$76", image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300", link: "https://theograce.com/p/2" },
      { title: "Birth Stone Bracelet", price: "$112", image_url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300", link: "https://theograce.com/p/3" },
      { title: "Initial Necklace", price: "$84", image_url: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=300", link: "https://theograce.com/p/4" },
      { title: "Pearl Studs", price: "$68", image_url: "https://images.unsplash.com/photo-1535632066274-36ee5b30b859?w=300", link: "https://theograce.com/p/5" },
      { title: "Charm Anklet", price: "$58", image_url: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=300", link: "https://theograce.com/p/6" },
    ],
    assets: withAssets
      ? {
          hero: SAMPLE_HERO,
          closing: SAMPLE_CLOSING,
          secondary: SAMPLE_SECONDARY,
          portrait: SAMPLE_PORTRAIT,
        }
      : {},
  };
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  const withAssets = process.argv.includes("--withAssets");
  const skeletons = loadAllSkeletons();
  const blueprint = sampleBlueprint(withAssets);
  const dir = join(process.cwd(), OUT_DIR);
  await mkdir(dir, { recursive: true });

  console.log(
    `Rendering ${skeletons.length} skeletons (withAssets=${withAssets}) → ${dir}/`,
  );

  const links: Array<{ id: string; name: string; campaignTypes: string[]; file: string }> = [];

  for (const skeleton of skeletons) {
    const { html, missingAssets } = await renderSkeleton(skeleton, blueprint, {
      withAssets,
    });
    const fileName = `${skeleton.id.replace(/\//g, "__")}.html`;
    await writeFile(join(dir, fileName), html, "utf8");
    links.push({
      id: skeleton.id,
      name: skeleton.name,
      campaignTypes: skeleton.campaignTypes,
      file: fileName,
    });
    console.log(
      `  ✓ ${skeleton.id}${
        missingAssets.length > 0
          ? ` (missing: ${missingAssets.join(", ")})`
          : ""
      }`,
    );
  }

  const groups = new Map<string, typeof links>();
  for (const link of links) {
    for (const type of link.campaignTypes) {
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(link);
    }
  }

  const sections = Array.from(groups.entries())
    .map(
      ([type, items]) => `
        <h2>${escape(type)}</h2>
        <ul>
          ${items
            .map(
              (i) =>
                `<li><a href="${escape(i.file)}" target="preview">${escape(i.name)}</a> <span class="id">${escape(i.id)}</span></li>`,
            )
            .join("")}
        </ul>`,
    )
    .join("");

  const indexHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Theo Grace · Skeleton Previews</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; margin: 0; display: flex; height: 100vh; }
    nav { width: 320px; padding: 16px; overflow-y: auto; border-right: 1px solid #eee; }
    nav h1 { font-size: 16px; margin: 0 0 12px; }
    nav h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin: 16px 0 4px; }
    nav ul { list-style: none; padding: 0; margin: 0; }
    nav li { padding: 4px 0; font-size: 13px; }
    nav a { text-decoration: none; color: #1E1E1E; }
    nav a:hover { text-decoration: underline; }
    .id { display: block; color: #999; font-size: 10px; }
    iframe { flex: 1; border: 0; }
    .meta { padding: 8px 16px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <nav>
    <h1>Skeleton Previews</h1>
    <p style="font-size: 11px; color: #666; margin-top: 0;">
      ${withAssets ? "Real sample assets" : "Placeholder assets — pass --withAssets for real images"}
    </p>
    ${sections}
    <div class="meta">${links.length} skeletons</div>
  </nav>
  <iframe name="preview" src="${escape(links[0]?.file ?? "about:blank")}"></iframe>
</body>
</html>`;

  await writeFile(join(dir, "index.html"), indexHtml, "utf8");

  console.log(`\nDone. Open file://${join(dir, "index.html")} in a browser.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
