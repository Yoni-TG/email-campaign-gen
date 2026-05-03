/**
 * Hand-authored brief set used by `scripts/eval-product-selection.ts` to
 * measure product-selection quality. Each brief carries:
 *
 *   - `seed`           — the CreativeSeed handed to selectProducts
 *   - `campaignType`   — drives stage-1 sort + downstream copy
 *   - `expectedAudience` — annotation only; the metric is "fraction of
 *                          picked products whose shop_for ∩ this set ≠ ∅"
 *
 * Briefs cover: men's, women's, mother/father days, editorial, sale,
 * collection spotlight, and audience-agnostic edge cases. The set is
 * small on purpose — small enough to read in one screen, large enough
 * that an audience regression shows up as multiple failing rows.
 */
import type {
  CampaignType,
  CreativeSeed,
  ShopForAudience,
} from "../src/lib/types";

export interface EvalBrief {
  name: string;
  campaignType: CampaignType;
  /** Seed handed to selectProducts. seed.targetAudience should mirror
   *  expectedAudience — what an operator actually picking that audience
   *  would input. */
  seed: CreativeSeed;
  /** Annotation only. The audience-match metric is "fraction of picked
   *  products whose shop_for ∩ this set ≠ ∅". */
  expectedAudience: ShopForAudience[];
  count: number;
}

export const EVAL_BRIEFS: EvalBrief[] = [
  {
    name: "men-bracelets-everyday",
    campaignType: "editorial",
    seed: {
      targetAudience: ["Men"],
      targetCategories: ["Bracelet"],
      mainMessage:
        "Bracelets for the men in your life — quiet pieces that say something",
      includeSms: false,
      leadValue: "meaningful_moments",
      leadPersonalities: ["charming", "warm_hearted"],
    },
    expectedAudience: ["Men"],
    count: 8,
  },
  {
    name: "fathers-day-personalized",
    campaignType: "holiday_seasonal",
    seed: {
      targetAudience: ["Father", "Men"],
      targetCategories: ["Necklace", "Bracelet"],
      mainMessage:
        "Father's Day picks that wear his story — names, dates, little reminders he matters",
      secondaryMessage: "Personalize for him",
      includeSms: true,
      leadValue: "family_first",
      leadPersonalities: ["warm_hearted"],
    },
    expectedAudience: ["Father", "Men"],
    count: 8,
  },
  {
    name: "men-holiday-gifts",
    campaignType: "holiday_seasonal",
    seed: {
      targetAudience: ["Men"],
      targetCategories: ["Necklace", "Bracelet"],
      mainMessage: "Holiday gifts for him — pieces he'll actually wear",
      includeSms: false,
      leadValue: "joy",
      leadPersonalities: ["fun", "charming"],
    },
    expectedAudience: ["Men"],
    count: 8,
  },
  {
    name: "men-bracelets-sale",
    campaignType: "sale_promo",
    seed: {
      targetAudience: ["Men"],
      targetCategories: ["Bracelet"],
      mainMessage: "Men's bracelets, 30% off this week",
      promoDetails: "30% OFF with code DAD30",
      includeSms: true,
      leadValue: "joy",
      leadPersonalities: ["fun"],
    },
    expectedAudience: ["Men"],
    count: 8,
  },
  {
    name: "mothers-day-classic",
    campaignType: "holiday_seasonal",
    seed: {
      targetAudience: ["Mother", "Grandmother"],
      targetCategories: ["Necklace"],
      mainMessage:
        "Mother's Day — pieces that hold every name she loves close",
      includeSms: false,
      leadValue: "family_first",
      leadPersonalities: ["warm_hearted", "charming"],
    },
    expectedAudience: ["Mother", "Grandmother"],
    count: 10,
  },
  {
    name: "mothers-day-budget",
    campaignType: "editorial",
    seed: {
      targetAudience: ["Mother"],
      targetCategories: ["Charm"],
      mainMessage:
        "Affordable Mother's Day picks under $50 — small charms with big meaning",
      includeSms: false,
      leadValue: "family_first",
      leadPersonalities: ["warm_hearted"],
    },
    expectedAudience: ["Mother"],
    count: 8,
  },
  {
    name: "grandmother-spotlight",
    campaignType: "editorial",
    seed: {
      targetAudience: ["Grandmother"],
      targetCategories: ["Necklace"],
      mainMessage: "Grandma's love, on a chain — stack the names she made",
      includeSms: false,
      leadValue: "family_first",
      leadPersonalities: ["warm_hearted"],
    },
    expectedAudience: ["Grandmother"],
    count: 8,
  },
  {
    name: "couples-anniversary-rings",
    campaignType: "editorial",
    seed: {
      targetAudience: ["Couple", "Women", "Men"],
      targetCategories: ["Ring"],
      mainMessage: "Anniversary rings that say what years can't",
      secondaryMessage: "Engrave the date you'd never forget",
      includeSms: false,
      leadValue: "meaningful_moments",
      leadPersonalities: ["charming", "warm_hearted"],
    },
    expectedAudience: ["Couple", "Women", "Men"],
    count: 8,
  },
  {
    name: "friendship-bracelets",
    campaignType: "editorial",
    seed: {
      targetAudience: ["Friends", "Women"],
      targetCategories: ["Bracelet"],
      mainMessage: "Best-friend bracelets — wear the bond",
      includeSms: false,
      leadValue: "joy",
      leadPersonalities: ["fun", "joyfully_characterful"],
    },
    expectedAudience: ["Friends", "Women"],
    count: 8,
  },
  {
    name: "kids-name-necklaces",
    campaignType: "collection_spotlight",
    seed: {
      targetAudience: ["Kids & Teens"],
      targetCategories: ["Name Necklace"],
      mainMessage: "First-name necklaces for the kids in your life",
      includeSms: false,
      leadValue: "joy",
      leadPersonalities: ["fun", "joyfully_characterful"],
    },
    expectedAudience: ["Kids & Teens"],
    count: 8,
  },
  {
    name: "editorial-joy-women",
    campaignType: "editorial",
    seed: {
      targetAudience: ["Women"],
      targetCategories: ["Necklace", "Earring"],
      mainMessage: "Bright pieces for bright days — lean into joy",
      includeSms: false,
      leadValue: "joy",
      leadPersonalities: ["joyfully_characterful", "fun"],
    },
    expectedAudience: ["Women"],
    count: 10,
  },
  {
    name: "editorial-top-sellers",
    campaignType: "collection_spotlight",
    seed: {
      targetAudience: ["Women", "Mother", "Grandmother"],
      targetCategories: ["Necklace", "Bracelet"],
      mainMessage: "Year after year, our most-loved pieces",
      includeSms: false,
      leadValue: "meaningful_moments",
      leadPersonalities: ["charming"],
    },
    // Audience-agnostic: any of these are acceptable matches.
    expectedAudience: ["Women", "Mother", "Grandmother"],
    count: 10,
  },
  {
    name: "sale-bracelets-sitewide",
    campaignType: "sale_promo",
    seed: {
      targetAudience: ["Women"],
      targetCategories: ["Bracelet"],
      mainMessage: "Up to 50% off bracelets — site-wide last weekend",
      promoDetails: "Up to 50% OFF",
      includeSms: true,
      leadValue: "joy",
      leadPersonalities: ["fun"],
    },
    expectedAudience: ["Women"],
    count: 10,
  },
  {
    name: "name-necklace-collection",
    campaignType: "collection_spotlight",
    seed: {
      targetAudience: ["Women", "Mother"],
      targetCategories: ["Name Necklace"],
      mainMessage: "The Name Necklace collection — every story starts with one",
      includeSms: false,
      leadValue: "meaningful_moments",
      leadPersonalities: ["charming", "warm_hearted"],
    },
    expectedAudience: ["Women", "Mother"],
    count: 10,
  },
  {
    name: "new-year-resolution",
    campaignType: "editorial",
    seed: {
      targetAudience: ["Women"],
      targetCategories: ["Necklace"],
      mainMessage: "New year, new you — pieces that mark new beginnings",
      includeSms: false,
      leadValue: "joy",
      leadPersonalities: ["joyfully_characterful"],
    },
    expectedAudience: ["Women"],
    count: 10,
  },
];
