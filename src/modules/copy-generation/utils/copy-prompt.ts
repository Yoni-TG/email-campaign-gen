import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CAMPAIGN_TYPE_LABELS,
  LEAD_PERSONALITY_DESCRIPTIONS,
  LEAD_PERSONALITY_LABELS,
  LEAD_VALUE_DESCRIPTIONS,
  LEAD_VALUE_LABELS,
  type CampaignType,
  type CreativeSeed,
  type Market,
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
const WINNING_SUBJECTS_PATH = join("src", "content", "winning-subjects.json");

let brandGuideCache: string | null = null;
let fewShotCache: FewShotExample[] | null = null;
let winningSubjectsCache: WinningSubject[] | null = null;

/**
 * Top-performing past subjects (pulled from Klaviyo by
 * `npm run report:klaviyo -- --write-winners`). The ranking is by
 * revenue per recipient — the closest proxy for "this subject made
 * money" — and tiny win-back / review-incentive sends are filtered
 * out. Klaviyo Liquid tokens are stripped because the copy generator
 * doesn't emit Liquid; first-name personalization is a separate
 * concern handled at paste-time.
 *
 * Optional file. If `winning-subjects.json` doesn't exist we fall
 * back to the static few-shots only — useful for fresh checkouts and
 * for keeping the test suite hermetic.
 */
export interface WinningSubject {
  subject: string;
  sentAt: string | null;
  recipients: number;
  openRate: number;
  conversionRate: number;
  revenuePerRecipient: number;
}

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

export function loadWinningSubjects(): WinningSubject[] {
  if (winningSubjectsCache !== null) return winningSubjectsCache;
  try {
    const raw = readFileSync(
      join(process.cwd(), WINNING_SUBJECTS_PATH),
      "utf-8",
    );
    winningSubjectsCache = JSON.parse(raw) as WinningSubject[];
  } catch {
    // Optional artefact — absent on fresh checkouts and in unit tests.
    winningSubjectsCache = [];
  }
  return winningSubjectsCache;
}

// ─── System prompt (stable → cacheable) ─────────────────────────────────────

// Explicit forbidden vocabulary elevated from brand-guide §9 so Claude sees
// the hard-no list at the top of its critical rules, not buried in §9.
const FORBIDDEN_WORDS =
  "timeless, essence, narrative, yearning, longing, journey, story (as brand filler), " +
  "perfect, signature, crafted, curated, luxurious, opulent, exquisite, " +
  "must-have, don't miss out, iconic, vibes, slay, era, main character";

const CRITICAL_RULES =
  `## Critical Rules\n` +
  `- Call the \`generate_campaign_copy\` tool; do not write prose outside the tool call.\n` +
  `- Obey §11 Output Contract exactly — body_blocks ordered top-to-bottom, SMS ≤130 chars, subject <50 chars preferred.\n` +
  `- NEVER use these words: ${FORBIDDEN_WORDS}. They are MYKA-relics or generic marketing filler.\n` +
  `- Match the voice to the lead_value + lead_personalities combination supplied in the brief.\n` +
  `- Match the energy to the campaign type (a sale has different energy than an editorial).\n` +
  `- DO NOT sound like AI, a textbook, or a catalogue. This is the single most important rule.\n` +
  `\n` +
  `Before returning, run the §12 Self-Check in order. Revise until every check passes:\n` +
  `  1. Would I say this to a friend?\n` +
  `  2. Any sentence over 25 words? If yes, break it up.\n` +
  `  3. Any forbidden word from §9 or the list above? If yes, swap.\n` +
  `  4. Any claim about us boastful in our own voice? If yes, move to nicky_quote or cut.\n` +
  `  5. Is there joy somewhere? If no, find it.\n` +
  `  6. Does this read more like MYKA or Theo Grace? (Compare §6.)\n` +
  `  7. Does spelling match the target market? (US vs UK — §8.6.)\n` +
  `  8. Does every CTA say something specific?\n` +
  `  9. Is the output valid JSON matching §11?\n` +
  ` 10. Is \`sms\` ≤130 chars when provided?\n` +
  ` 11. Are all body_blocks non-empty (at least one of title / description / cta filled)?`;

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
  `Use the \`{link}\` placeholder for the CTA URL.\n` +
  `- nicky_quote is optional. Use it only when a claim about Theo Grace would ` +
  `sound boastful in our own voice (brand-guide §7). Max one per email. The ` +
  `quote must sound like a real person (short, specific, on-persona); the ` +
  `response field is an optional warm reply like "Thank you Nicky!".`;

let systemPromptCache: string | null = null;

export function buildCopySystemPrompt(): string {
  if (systemPromptCache !== null) return systemPromptCache;

  const guide = loadBrandGuide();
  const examples = loadFewShotExamples();
  const winners = loadWinningSubjects();

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

  const winnersSection = buildWinningSubjectsSection(winners);

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
    ...(winnersSection ? [winnersSection, ``] : []),
    CRITICAL_RULES,
  ].join("\n");

  return systemPromptCache;
}

/**
 * Renders the high-performing subject section. Each row shows the
 * subject + the revenue-per-recipient it earned — the perf number is
 * the social proof: "this subject earned $X per email sent." Ranked
 * by $/recipient. Returns null when no winners file is loaded so the
 * section is omitted entirely from the system prompt.
 *
 * Design notes:
 * - We surface $/recipient and conversion rate, not open rate, because
 *   open rate is a noisy proxy here (mean 50%+ regardless of subject).
 * - We do NOT instruct Claude to copy these verbatim — we want voice,
 *   shape, and rhythm to be lifted, not the exact wording. The phrase
 *   "emulate tone and structure" is load-bearing.
 */
function buildWinningSubjectsSection(winners: WinningSubject[]): string | null {
  if (winners.length === 0) return null;
  const rows = winners
    .map(
      (w) =>
        `- "${w.subject}"  (${formatCents(w.revenuePerRecipient)}/recipient, conv ${formatConv(w.conversionRate)})`,
    )
    .join("\n");
  return [
    `## High-Performing Past Subjects`,
    ``,
    `These subject lines earned the most revenue per email sent at Theo Grace ` +
      `over the recent send window. Use them as a reference for tone, length, ` +
      `urgency, emoji usage, and rhythm — emulate the *shape* but never ` +
      `re-use a subject verbatim. The metric in parentheses is revenue per ` +
      `recipient (the strongest signal we have for "this subject converted") ` +
      `followed by conversion rate.`,
    ``,
    rows,
  ].join("\n");
}

function formatCents(value: number): string {
  return `$${value.toFixed(3)}`;
}

function formatConv(value: number): string {
  return `${(value * 100).toFixed(3)}%`;
}

// ─── User prompt (varies per campaign) ──────────────────────────────────────

function describePersonality(p: CreativeSeed["leadPersonalities"][number]): string {
  return `${LEAD_PERSONALITY_LABELS[p]} (${LEAD_PERSONALITY_DESCRIPTIONS[p]})`;
}

function marketLine(market: Market): string {
  return market === "uk"
    ? `- Market: UK — use UK spelling (jewellery, personalise, favourite, colour) and UK date format (e.g. 15th November 2025)`
    : `- Market: US — use US spelling (jewelry, personalize, favorite, color) and US date format (e.g. November 15th 2025)`;
}

export function buildCopyUserPrompt(
  seed: CreativeSeed,
  campaignType: CampaignType,
): string {
  const market: Market = seed.market ?? "us";
  const personalityDescriptions = seed.leadPersonalities
    .map(describePersonality)
    .join("; ");

  const lines: string[] = [
    `Write email campaign copy for the following brief:`,
    ``,
    `- Campaign type: ${CAMPAIGN_TYPE_LABELS[campaignType]}`,
    marketLine(market),
    `- Lead value: ${LEAD_VALUE_LABELS[seed.leadValue]} — ${LEAD_VALUE_DESCRIPTIONS[seed.leadValue]}`,
    `- Lead personalities: ${personalityDescriptions}`,
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
      ? `- Include SMS copy (short, punchy, with \`{link}\` placeholder — ≤130 chars)`
      : `- No SMS copy needed`,
  );
  lines.push(
    seed.includeNicky
      ? `- Nicky quote allowed: include a \`nicky_quote\` if a claim about Theo Grace would sound boastful in our own voice (brand-guide §7). Max one per email.`
      : `- Do NOT generate a nicky_quote — return null. The operator will add one on demand from the fine-tune editor.`,
  );

  return lines.join("\n");
}

// Test helper — reset the module-level caches so individual tests can force
// a re-read. Not intended for production code.
export function __resetPromptCaches(): void {
  brandGuideCache = null;
  fewShotCache = null;
  winningSubjectsCache = null;
  systemPromptCache = null;
}
