#!/usr/bin/env tsx
/**
 * Offline catalog generator — renders every skeleton to disk as a static
 * HTML file plus an index page. Mirror of the /skeletons app route. Pulls
 * sample data from src/modules/email-templates/dev/sample-data.ts so the
 * route and the script stay in sync.
 *
 *   npx tsx scripts/preview-skeletons.ts                # placeholder assets
 *   npx tsx scripts/preview-skeletons.ts --withAssets   # real sample images
 *
 * Output: out/skeleton-previews/index.html.
 */

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderSkeleton } from "@/modules/email-templates";
import { loadAllSkeletons } from "@/modules/email-templates/skeletons";
import { sampleBlueprint } from "@/modules/email-templates/dev";

const OUT_DIR = "out/skeleton-previews";

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
