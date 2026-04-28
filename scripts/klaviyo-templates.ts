#!/usr/bin/env tsx
/**
 * Phase J — Klaviyo template extraction.
 *
 * Read-only. Pulls past email templates so we can audit the brand's
 * actual rendered designs and translate selected sections into our
 * React-Email block library. This is the *primary* component-import
 * path; the Universal Content API is too restricted (most block types
 * return data: null) to serve as the source.
 *
 * Usage:
 *   npx tsx scripts/klaviyo-templates.ts --list
 *   npx tsx scripts/klaviyo-templates.ts --extract <id>
 *
 * Output (extract mode):
 *   out/templates/<id>/raw.html             — original HTML body
 *   out/templates/<id>/sections.json        — structured per-section data
 *   out/templates/<id>/colors.json          — full color palette by frequency
 *   out/templates/<id>/sections/section-NN-<guess>.html — each section
 *                                              standalone for browser eyeballing
 *   out/templates/<id>/meta.json            — name, editor, timestamps
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { KlaviyoClient } from "../src/modules/klaviyo/services/klaviyo-client";
import { parseTemplateHtml } from "../src/modules/klaviyo/utils/template-parser";

interface Args {
  mode: "list" | "extract";
  templateId: string | null;
  outBase: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    mode: "list",
    templateId: null,
    outBase: "out/templates",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--list":
        out.mode = "list";
        break;
      case "--extract":
        out.mode = "extract";
        out.templateId = next ?? null;
        if (next && !next.startsWith("--")) i++;
        break;
      case "--out":
        out.outBase = next;
        i++;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }
  if (out.mode === "extract" && !out.templateId) {
    throw new Error("--extract requires a template id");
  }
  return out;
}

function printHelp(): void {
  console.log(
    [
      "Klaviyo template inventory + extraction.",
      "",
      "Modes:",
      "  --list                List every template in the workspace",
      "  --extract <id>        Pull one template, parse it, write to out/templates/<id>/",
      "",
      "Options:",
      "  --out <dir>           Output base directory (default: out/templates)",
    ].join("\n"),
  );
}

async function listMode(client: KlaviyoClient): Promise<void> {
  console.log("[klaviyo-templates] paginating /api/templates…");
  const templates = await client.listTemplates({
    onPage: (loaded) =>
      process.stdout.write(`\r[klaviyo-templates] loaded ${loaded}…  `),
  });
  process.stdout.write("\n");
  console.log(`[klaviyo-templates] ${templates.length} templates in this workspace:`);
  console.log("");
  console.log("ID                              EDITOR        UPDATED                      NAME");
  console.log("─".repeat(120));
  const sorted = [...templates].sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );
  for (const t of sorted) {
    const id = t.id.padEnd(32);
    const editor = (t.editor ?? "").padEnd(13);
    const updated = (t.updatedAt ?? "").padEnd(28);
    console.log(`${id}${editor}${updated}${t.name}`);
  }
}

async function extractMode(
  client: KlaviyoClient,
  templateId: string,
  outBase: string,
): Promise<void> {
  console.log(`[klaviyo-templates] fetching template ${templateId}…`);
  const template = await client.getTemplate(templateId);

  const targetDir = resolve(outBase, templateId);
  await mkdir(targetDir, { recursive: true });
  await mkdir(join(targetDir, "sections"), { recursive: true });

  const meta = {
    id: template.id,
    name: template.name,
    editor: template.editor,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    hasDefinition: template.definition !== null,
  };
  await writeFile(join(targetDir, "meta.json"), JSON.stringify(meta, null, 2), "utf8");
  await writeFile(join(targetDir, "raw.html"), template.html, "utf8");

  if (template.definition) {
    await writeFile(
      join(targetDir, "definition.json"),
      JSON.stringify(template.definition, null, 2),
      "utf8",
    );
  }

  if (!template.html) {
    console.log("[klaviyo-templates] no HTML body — only definition.json was written");
    return;
  }

  const parsed = parseTemplateHtml(template.html);

  await writeFile(
    join(targetDir, "sections.json"),
    JSON.stringify(parsed.sections, null, 2),
    "utf8",
  );
  await writeFile(
    join(targetDir, "colors.json"),
    JSON.stringify(parsed.colorPalette, null, 2),
    "utf8",
  );

  for (const section of parsed.sections) {
    const filename = join(
      targetDir,
      "sections",
      `section-${String(section.index).padStart(2, "0")}-${section.guess}.html`,
    );
    const standalone =
      `<!doctype html><html><head><meta charset="utf-8"><title>` +
      `${escapeHtml(template.name)} — section ${section.index} (${section.guess})</title>` +
      `</head><body><table cellpadding="0" cellspacing="0">` +
      `${section.html}</table></body></html>`;
    await writeFile(filename, standalone, "utf8");
  }

  console.log(
    `[klaviyo-templates] parsed: ${parsed.sections.length} sections, ` +
      `${parsed.colorPalette.length} unique colors`,
  );
  console.log("");
  console.log("Section breakdown:");
  for (const s of parsed.sections) {
    const preview = s.text.slice(0, 70) + (s.text.length > 70 ? "…" : "");
    console.log(
      `  ${String(s.index).padStart(2, "0")}  ${s.guess.padEnd(11)}  ` +
        `${s.imageUrls.length}img  ${s.buttonLabels.length}btn  ${s.colors.length}colors  ` +
        `"${preview}"`,
    );
  }
  console.log("");
  console.log(`Top 10 colors by frequency:`);
  for (const c of parsed.colorPalette.slice(0, 10)) {
    console.log(`  ${c.color.padEnd(12)} ${c.count}`);
  }
  console.log("");
  console.log(`[klaviyo-templates] wrote ${targetDir}/`);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const client = new KlaviyoClient();
  if (args.mode === "list") {
    await listMode(client);
  } else if (args.mode === "extract" && args.templateId) {
    await extractMode(client, args.templateId, args.outBase);
  }
}

main().catch((err) => {
  console.error("[klaviyo-templates] failed:");
  console.error(err);
  process.exit(1);
});
