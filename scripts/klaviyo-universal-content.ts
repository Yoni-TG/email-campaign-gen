#!/usr/bin/env tsx
/**
 * Phase J — Klaviyo Universal Content extraction.
 *
 * Read-only. Pulls the brand's saved reusable blocks (Universal Content
 * in Klaviyo's drag-and-drop editor — the closest thing to a brand
 * component library). Atomic block types (button, image, text, etc.)
 * come through with structured props; `html`-type blocks carry raw
 * HTML that we run through the template parser for section structure.
 *
 * Usage:
 *   npx tsx scripts/klaviyo-universal-content.ts --list
 *   npx tsx scripts/klaviyo-universal-content.ts --extract <id>
 *   npx tsx scripts/klaviyo-universal-content.ts --extract-all
 *
 * Output (extract / extract-all):
 *   out/universal-content/<id>/meta.json        — name, type, timestamps
 *   out/universal-content/<id>/definition.json  — full structured payload
 *   out/universal-content/<id>/raw.html         — html-type only
 *   out/universal-content/<id>/sections.json    — html-type only (parsed)
 *   out/universal-content/<id>/colors.json      — html-type only
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { KlaviyoClient } from "../src/modules/klaviyo/services/klaviyo-client";
import type { KlaviyoUniversalContentFull } from "../src/modules/klaviyo/services/klaviyo-client";
import { parseTemplateHtml } from "../src/modules/klaviyo/utils/template-parser";

interface Args {
  mode: "list" | "extract" | "extract-all";
  blockId: string | null;
  outBase: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    mode: "list",
    blockId: null,
    outBase: "out/universal-content",
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
        out.blockId = next ?? null;
        if (next && !next.startsWith("--")) i++;
        break;
      case "--extract-all":
        out.mode = "extract-all";
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
  if (out.mode === "extract" && !out.blockId) {
    throw new Error("--extract requires a universal-content id");
  }
  return out;
}

function printHelp(): void {
  console.log(
    [
      "Klaviyo Universal Content extraction.",
      "",
      "Modes:",
      "  --list                List every UC block in the workspace",
      "  --extract <id>        Pull one block, dump structured + parsed output",
      "  --extract-all         Pull every block (saves round-trips for full inventory)",
      "",
      "Options:",
      "  --out <dir>           Output base directory (default: out/universal-content)",
    ].join("\n"),
  );
}

async function listMode(client: KlaviyoClient): Promise<void> {
  const blocks = await client.listUniversalContent();
  console.log(
    `[universal-content] ${blocks.length} blocks in this workspace:`,
  );
  console.log("");
  console.log("ID                              TYPE             UPDATED                      NAME");
  console.log("─".repeat(120));
  const sorted = [...blocks].sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );
  const counts = new Map<string, number>();
  for (const b of sorted) {
    counts.set(b.type, (counts.get(b.type) ?? 0) + 1);
    const id = b.id.padEnd(32);
    const type = b.type.padEnd(17);
    const updated = (b.updatedAt ?? "").padEnd(28);
    console.log(`${id}${type}${updated}${b.name}`);
  }
  console.log("");
  console.log("By type:");
  const sortedCounts = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedCounts) {
    console.log(`  ${type.padEnd(20)} ${count}`);
  }
}

async function extractOne(
  block: KlaviyoUniversalContentFull,
  outBase: string,
): Promise<void> {
  const targetDir = resolve(outBase, block.id);
  await mkdir(targetDir, { recursive: true });

  const meta = {
    id: block.id,
    name: block.name,
    type: block.type,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
  };
  await writeFile(
    join(targetDir, "meta.json"),
    JSON.stringify(meta, null, 2),
    "utf8",
  );
  await writeFile(
    join(targetDir, "definition.json"),
    JSON.stringify(block.definition, null, 2),
    "utf8",
  );

  // For html blocks, the raw HTML is buried inside `definition`. Try the
  // common Klaviyo paths; bail gracefully if the shape differs.
  const html = extractHtmlFromDefinition(block.definition);
  if (block.type === "html" && html) {
    await writeFile(join(targetDir, "raw.html"), html, "utf8");
    const parsed = parseTemplateHtml(html);
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
  }

  console.log(
    `[universal-content] wrote ${targetDir}/  (${block.type}${html ? `, ${html.length} chars HTML` : ""})`,
  );
}

function extractHtmlFromDefinition(def: unknown): string | null {
  if (!def || typeof def !== "object") return null;
  const root = def as Record<string, unknown>;
  // Common shapes seen in Klaviyo Universal Content payloads:
  //   { data: { content: "<html>..." } }
  //   { content: "<html>..." }
  //   { html: "<html>..." }
  const data = root.data as Record<string, unknown> | undefined;
  if (data && typeof data.content === "string") return data.content;
  if (typeof root.content === "string") return root.content;
  if (typeof root.html === "string") return root.html;
  return null;
}

async function extractMode(
  client: KlaviyoClient,
  blockId: string,
  outBase: string,
): Promise<void> {
  console.log(`[universal-content] fetching block ${blockId}…`);
  const block = await client.getUniversalContent(blockId);
  await extractOne(block, outBase);
}

async function extractAllMode(
  client: KlaviyoClient,
  outBase: string,
): Promise<void> {
  const summaries = await client.listUniversalContent();
  console.log(
    `[universal-content] fetching ${summaries.length} blocks…`,
  );
  for (const summary of summaries) {
    const full = await client.getUniversalContent(summary.id);
    await extractOne(full, outBase);
  }
  console.log(
    `[universal-content] done — ${summaries.length} blocks under ${resolve(outBase)}/`,
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const client = new KlaviyoClient();

  if (args.mode === "list") {
    await listMode(client);
  } else if (args.mode === "extract" && args.blockId) {
    await extractMode(client, args.blockId, args.outBase);
  } else if (args.mode === "extract-all") {
    await extractAllMode(client, args.outBase);
  }
}

main().catch((err) => {
  console.error("[universal-content] failed:");
  console.error(err);
  process.exit(1);
});
