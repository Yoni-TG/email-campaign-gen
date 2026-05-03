/**
 * Brief set for `scripts/eval-skeleton-selection.ts`. 20 hand-authored
 * briefs spanning all 5 campaign types, mixing voice, product count,
 * Nicky-quote presence, and main-message angle so we can measure how
 * concentrated the skeleton picks are.
 *
 * Each brief is the SelectionInput shape — what `selectSkeletons` consumes.
 * The eval script reads these, calls selectSkeletons for each, and reports
 * per-type pick distribution + diversity metrics.
 */
import type { SelectionInput } from "../src/modules/email-templates/selection";

export interface TemplateEvalBrief {
  name: string;
  input: SelectionInput;
}

export const EVAL_TEMPLATE_BRIEFS: TemplateEvalBrief[] = [
  // ─── sale_promo (4) ───
  {
    name: "sale-mystery-tonight-only",
    input: {
      campaignType: "sale_promo",
      leadValue: "joy",
      leadPersonalities: ["fun", "joyfully_characterful"],
      productCount: 4,
      bodyBlockCount: 1,
      hasNickyQuote: false,
      mainMessage:
        "Mystery sale — TONIGHT ONLY. Up to 50% off. The deal reveals at checkout.",
    },
  },
  {
    name: "sale-typography-no-hero",
    input: {
      campaignType: "sale_promo",
      leadValue: "joy",
      leadPersonalities: ["charming"],
      productCount: 6,
      bodyBlockCount: 1,
      hasNickyQuote: false,
      mainMessage: "Up to 30% off bestsellers. Type-led, clean, no fuss.",
    },
  },
  {
    name: "sale-photo-overlay-mothers-day",
    input: {
      campaignType: "sale_promo",
      leadValue: "family_first",
      leadPersonalities: ["warm_hearted"],
      productCount: 4,
      bodyBlockCount: 2,
      hasNickyQuote: false,
      mainMessage:
        "Mother's Day — 20% off + free expedited shipping. Hero photo over offer.",
      targetAudience: ["Mother", "Grandmother"],
    },
  },
  {
    name: "sale-mens-bracelets-30",
    input: {
      campaignType: "sale_promo",
      leadValue: "joy",
      leadPersonalities: ["fun"],
      productCount: 6,
      bodyBlockCount: 1,
      hasNickyQuote: false,
      mainMessage: "Men's bracelets, 30% off this week.",
      targetAudience: ["Men"],
    },
  },

  // ─── product_launch (4) ───
  {
    name: "launch-charmed-collection",
    input: {
      campaignType: "product_launch",
      leadValue: "meaningful_moments",
      leadPersonalities: ["charming"],
      productCount: 10,
      bodyBlockCount: 3,
      hasNickyQuote: true,
      mainMessage:
        "The Charmed Collection — Nicky's debut, 10 new pieces with personalization stories.",
    },
  },
  {
    name: "launch-anchor-locket-single-hero",
    input: {
      campaignType: "product_launch",
      leadValue: "meaningful_moments",
      leadPersonalities: ["charming", "warm_hearted"],
      productCount: 1,
      bodyBlockCount: 2,
      hasNickyQuote: false,
      mainMessage:
        "Meet the Bee Loved Locket — our new signature piece. Single-hero focus.",
    },
  },
  {
    name: "launch-stackables-grid",
    input: {
      campaignType: "product_launch",
      leadValue: "joy",
      leadPersonalities: ["fun"],
      productCount: 6,
      bodyBlockCount: 1,
      hasNickyQuote: false,
      mainMessage: "Stackable rings — six new stacks, mix-and-match grid.",
    },
  },
  {
    name: "launch-arabic-namelace-editorial",
    input: {
      campaignType: "product_launch",
      leadValue: "family_first",
      leadPersonalities: ["warm_hearted"],
      productCount: 4,
      bodyBlockCount: 3,
      hasNickyQuote: false,
      mainMessage:
        "Arabic name necklaces — narrative-led story about family heritage.",
      targetAudience: ["Mother", "Grandmother", "Women"],
    },
  },

  // ─── editorial (4) ───
  {
    name: "editorial-spring-refresh",
    input: {
      campaignType: "editorial",
      leadValue: "joy",
      leadPersonalities: ["joyfully_characterful", "fun"],
      productCount: 4,
      bodyBlockCount: 1,
      hasNickyQuote: false,
      mainMessage: "Spring layering — refresh your stack.",
    },
  },
  {
    name: "editorial-warm-everyday",
    input: {
      campaignType: "editorial",
      leadValue: "meaningful_moments",
      leadPersonalities: ["warm_hearted"],
      productCount: 6,
      bodyBlockCount: 2,
      hasNickyQuote: false,
      mainMessage:
        "Pieces for the small moments — coffee, school runs, voicemails.",
    },
  },
  {
    name: "editorial-nicky-confession",
    input: {
      campaignType: "editorial",
      leadValue: "joy",
      leadPersonalities: ["charming"],
      productCount: 4,
      bodyBlockCount: 2,
      hasNickyQuote: true,
      mainMessage: "Nicky's picks for the season — quote-led editorial.",
    },
  },
  {
    name: "editorial-grandma-stack",
    input: {
      campaignType: "editorial",
      leadValue: "family_first",
      leadPersonalities: ["warm_hearted"],
      productCount: 4,
      bodyBlockCount: 2,
      hasNickyQuote: false,
      mainMessage: "Grandma's love, on a chain — stack the names she made.",
      targetAudience: ["Grandmother"],
    },
  },

  // ─── collection_spotlight (4) ───
  {
    name: "collection-name-necklaces",
    input: {
      campaignType: "collection_spotlight",
      leadValue: "meaningful_moments",
      leadPersonalities: ["charming", "warm_hearted"],
      productCount: 8,
      bodyBlockCount: 2,
      hasNickyQuote: false,
      mainMessage:
        "The Name Necklace collection — every story starts with one.",
    },
  },
  {
    name: "collection-bestsellers-aging-well",
    input: {
      campaignType: "collection_spotlight",
      leadValue: "meaningful_moments",
      leadPersonalities: ["charming"],
      productCount: 6,
      bodyBlockCount: 2,
      hasNickyQuote: false,
      mainMessage: "Year after year, our most-loved pieces.",
    },
  },
  {
    name: "collection-tier-grouped-budget-luxury",
    input: {
      campaignType: "collection_spotlight",
      leadValue: "joy",
      leadPersonalities: ["fun"],
      productCount: 9,
      bodyBlockCount: 1,
      hasNickyQuote: false,
      mainMessage:
        "Three price tiers, three vibes — entry, sweet spot, hero pieces.",
    },
  },
  {
    name: "collection-quote-led-charms",
    input: {
      campaignType: "collection_spotlight",
      leadValue: "joy",
      leadPersonalities: ["joyfully_characterful"],
      productCount: 6,
      bodyBlockCount: 1,
      hasNickyQuote: true,
      mainMessage: "The Charm Collection — Nicky's voice, your story.",
    },
  },

  // ─── holiday_seasonal (4) ───
  {
    name: "holiday-mothers-day-gift-guide",
    input: {
      campaignType: "holiday_seasonal",
      leadValue: "family_first",
      leadPersonalities: ["warm_hearted"],
      productCount: 8,
      bodyBlockCount: 2,
      hasNickyQuote: false,
      mainMessage:
        "Mother's Day gift guide — pieces she'll treasure long after the flowers fade.",
      targetAudience: ["Mother", "Grandmother"],
    },
  },
  {
    name: "holiday-fathers-day-personalized",
    input: {
      campaignType: "holiday_seasonal",
      leadValue: "family_first",
      leadPersonalities: ["warm_hearted"],
      productCount: 6,
      bodyBlockCount: 2,
      hasNickyQuote: false,
      mainMessage:
        "Father's Day — names, dates, little reminders he matters.",
      targetAudience: ["Father", "Men"],
    },
  },
  {
    name: "holiday-easter-warm-wish",
    input: {
      campaignType: "holiday_seasonal",
      leadValue: "joy",
      leadPersonalities: ["warm_hearted"],
      productCount: 0,
      bodyBlockCount: 1,
      hasNickyQuote: false,
      mainMessage:
        "Wishing you a beautiful Easter — text-based, no products.",
    },
  },
  {
    name: "holiday-valentines-urgency",
    input: {
      campaignType: "holiday_seasonal",
      leadValue: "joy",
      leadPersonalities: ["fun"],
      productCount: 4,
      bodyBlockCount: 1,
      hasNickyQuote: false,
      mainMessage:
        "Valentine's Day — order by Tuesday for guaranteed delivery. Urgency banner.",
    },
  },
];
