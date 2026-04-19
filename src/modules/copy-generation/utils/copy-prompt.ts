import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CAMPAIGN_TYPE_LABELS,
  type CampaignType,
  type CreativeSeed,
  type GeneratedCopy,
} from "@/lib/types";

export interface FewShotExample {
  input: Record<string, unknown>;
  output: GeneratedCopy;
}

const BRAND_GUIDE_PATH = join("src", "content", "brand-guide.md");
const FEW_SHOT_PATH = join("src", "content", "few-shot-examples.json");

let brandGuideCache: string | null = null;
let fewShotCache: FewShotExample[] | null = null;

export function loadBrandGuide(): string {
  if (brandGuideCache !== null) return brandGuideCache;
  brandGuideCache = readFileSync(join(process.cwd(), BRAND_GUIDE_PATH), "utf-8");
  return brandGuideCache;
}

export function loadFewShotExamples(): FewShotExample[] {
  if (fewShotCache !== null) return fewShotCache;
  const raw = readFileSync(join(process.cwd(), FEW_SHOT_PATH), "utf-8");
  fewShotCache = JSON.parse(raw) as FewShotExample[];
  return fewShotCache;
}

// ─── System prompt (stable → cacheable) ─────────────────────────────────────

const CRITICAL_RULES =
  `## Critical Rules\n` +
  `- Write like you're speaking to a friend\n` +
  `- US English only\n` +
  `- NO puns, slang, or crass humor\n` +
  `- DO NOT sound like AI or a textbook — this is the most important rule\n` +
  `- Match the energy to the campaign type (a sale has different energy than an editorial)\n` +
  `- Call the generate_campaign_copy tool; do not write prose outside the tool call`;

const OUTPUT_FORMAT =
  `## Output Format\n` +
  `Generate email campaign copy as structured data using the provided tool ` +
  `(generate_campaign_copy). Produce exactly 3 subject-line options with different ` +
  `angles: one emotional, one curiosity-driven, one direct-benefit. Each block ` +
  `(hero, secondary, primary CTA, SMS when requested) must be filled in full — ` +
  `do not leave placeholders.`;

let systemPromptCache: string | null = null;

export function buildCopySystemPrompt(): string {
  if (systemPromptCache !== null) return systemPromptCache;

  const guide = loadBrandGuide();
  const examples = loadFewShotExamples();

  const examplesText = examples
    .map(
      (ex, i) =>
        `### Example ${i + 1}\n` +
        `Input: ${JSON.stringify(ex.input)}\n` +
        `Output: ${JSON.stringify(ex.output, null, 2)}`,
    )
    .join("\n\n");

  systemPromptCache = [
    `You are the Theo Grace email-campaign copy agent.`,
    ``,
    `## Brand Guide`,
    guide,
    ``,
    OUTPUT_FORMAT,
    ``,
    `## Past Campaign Examples`,
    examplesText,
    ``,
    CRITICAL_RULES,
  ].join("\n");

  return systemPromptCache;
}

// ─── User prompt (varies per campaign) ──────────────────────────────────────

export function buildCopyUserPrompt(
  seed: CreativeSeed,
  campaignType: CampaignType,
): string {
  const lines: string[] = [
    `Write email campaign copy for the following brief:`,
    ``,
    `- Campaign type: ${CAMPAIGN_TYPE_LABELS[campaignType]}`,
    `- Main message: ${seed.mainMessage}`,
    `- Target product categories: ${seed.targetCategories.join(", ")}`,
  ];

  if (seed.secondaryMessage) {
    lines.push(`- Secondary message: ${seed.secondaryMessage}`);
  }
  if (seed.promoDetails) {
    lines.push(`- Promo details: ${seed.promoDetails}`);
  }
  if (seed.additionalNotes) {
    lines.push(`- Additional notes: ${seed.additionalNotes}`);
  }
  lines.push(
    seed.includeSms
      ? `- Include SMS copy (short, punchy, with link)`
      : `- No SMS copy needed`,
  );

  return lines.join("\n");
}

// Test helper — reset the module-level caches so individual tests can force
// a re-read. Not intended for production code.
export function __resetPromptCaches(): void {
  brandGuideCache = null;
  fewShotCache = null;
  systemPromptCache = null;
}
