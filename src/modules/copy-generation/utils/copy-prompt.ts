import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CAMPAIGN_TYPE_LABELS,
  type CampaignType,
  type CreativeSeed,
} from "@/lib/types";

/**
 * Past campaign record — the shape in `src/content/few-shot-examples.json`.
 * These are raw archived campaigns, not `{input, output}` training pairs.
 * The fields mirror how Theo Grace builds real sends today:
 *
 *   body_blocks[i]     — sections in order; 0 sits under the hero banner,
 *                        1 below it, and so on. Typical count 1-3.
 *   subject_variants[] — 1-2 subject + preheader pairs for A/B testing.
 *   sms                — short message copy (≤130 chars); some campaigns
 *                        omit it.
 *   free_top_text      — optional banner line above the hero.
 */
export interface FewShotExample {
  month: string;
  campaign_name: string;
  free_top_text: string | null;
  body_blocks: Array<{
    title: string | null;
    description: string | null;
    cta: string | null;
  }>;
  subject_variants: Array<{
    subject: string;
    preheader: string;
  }>;
  sms: string | null;
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
  `- Call the generate_campaign_copy tool; do not write prose outside the tool call\n` +
  `- Obey §11 Output Contract exactly — body_blocks ordered top-to-bottom, SMS ≤130 chars`;

const OUTPUT_FORMAT =
  `## Output Format\n` +
  `Return the campaign copy through the \`generate_campaign_copy\` tool, matching ` +
  `§11 Output Contract in the brand guide. Key reminders:\n` +
  `- body_blocks is an ordered list of email sections — index 0 appears directly ` +
  `under the hero banner, index 1 beneath it, and so on. 1–3 blocks is typical.\n` +
  `- Each body block may set any of title, description, cta to null when that ` +
  `role isn't needed, but do not return a block with all three null.\n` +
  `- Provide 1–2 subject_variants (subject + preheader pair). Each pair should ` +
  `read together — don't repeat the subject inside the preheader.\n` +
  `- free_top_text is the optional banner text above the hero; null when the ` +
  `campaign doesn't need one.\n` +
  `- sms is optional and capped at 130 characters (including spaces and emoji). ` +
  `Use the \`{link}\` placeholder for the CTA URL.`;

let systemPromptCache: string | null = null;

export function buildCopySystemPrompt(): string {
  if (systemPromptCache !== null) return systemPromptCache;

  const guide = loadBrandGuide();
  const examples = loadFewShotExamples();

  // Each example is a past campaign archive — the month + campaign name form
  // the brief context, and the rest of the fields are the shape the tool
  // must return.
  const examplesText = examples
    .map((ex, i) => {
      const { month, campaign_name, ...output } = ex;
      return (
        `### Example ${i + 1}: ${month} — ${campaign_name}\n` +
        `Tool output:\n${JSON.stringify(output, null, 2)}`
      );
    })
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
