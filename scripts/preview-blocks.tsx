#!/usr/bin/env tsx
/**
 * Offline catalog generator — renders every entry in BLOCK_PREVIEWS to disk
 * as a static HTML file plus an index page. Mirrors the /blocks app route
 * (same source of truth: src/modules/email-templates/dev/block-previews.tsx)
 * and is the right tool when you don't want to spin up the dev server.
 *
 *   npx tsx scripts/preview-blocks.tsx
 *
 * Output: out/block-previews/index.html.
 */

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  BLOCK_PREVIEWS,
  renderBlockToHtml,
} from "@/modules/email-templates/dev";

const OUT_DIR = "out/block-previews";

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  const dir = join(process.cwd(), OUT_DIR);
  await mkdir(dir, { recursive: true });
  console.log(`Rendering ${BLOCK_PREVIEWS.length} block previews → ${dir}/`);

  for (const preview of BLOCK_PREVIEWS) {
    const html = await renderBlockToHtml(preview.jsx);
    await writeFile(join(dir, `${preview.id}.html`), html, "utf8");
    console.log(`  ✓ ${preview.label}${preview.variant ? ` (${preview.variant})` : ""}`);
  }

  const grouped = new Map<string, typeof BLOCK_PREVIEWS>();
  for (const p of BLOCK_PREVIEWS) {
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
                  <iframe src="${escape(i.id)}.html" style="width:100%;height:${i.height}px" title="${escape(i.id)}"></iframe>
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
    body { font-family: -apple-system, system-ui, sans-serif; background: #fafafa; margin: 0; padding: 24px; color: #1E1E1E; }
    h1 { font-family: Georgia, serif; font-size: 24px; margin: 0 0 4px; }
    .lede { color: #666; font-size: 13px; margin: 0 0 32px; }
    .block-group { margin-bottom: 48px; background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; padding: 20px; }
    .block-group h2 { font-family: ui-monospace, "SF Mono", monospace; font-size: 13px; color: #444; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
    .preview-tile { margin-bottom: 24px; }
    .preview-tile:last-child { margin-bottom: 0; }
    .variant { font-size: 11px; color: #888; margin: 0 0 6px; font-family: ui-monospace, "SF Mono", monospace; }
    iframe { border: 1px solid #eee; background: #fff; display: block; max-width: 640px; }
  </style>
</head>
<body>
  <h1>Block Catalog</h1>
  <p class="lede">${BLOCK_PREVIEWS.length} previews across ${grouped.size} block types. Mirror of the /blocks route.</p>
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
