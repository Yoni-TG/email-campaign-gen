// Shared sample data for the design-catalog routes (/blocks, /skeletons) and
// the offline preview scripts (scripts/preview-blocks.tsx,
// scripts/preview-skeletons.ts). Keeping one source of truth means both
// surfaces show the same thing — no fork between "what the script renders"
// and "what the route renders".

import type { CampaignBlueprint } from "@/lib/types";
import type { BlueprintProduct } from "../blocks/types";

export const SAMPLE_HERO_URL =
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=640";
export const SAMPLE_CLOSING_URL =
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=640";
export const SAMPLE_SECONDARY_URL =
  "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=640";
export const SAMPLE_PORTRAIT_URL =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200";

export const SAMPLE_PRODUCTS: BlueprintProduct[] = [
  { sku: "TG-HEART-01", title: "Heart Pendant", price: "$98", image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300", link: "#" },
  { sku: "TG-STACK-01", title: "Stack Ring Set", price: "$76", image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300", link: "#" },
  { sku: "TG-BIRTH-01", title: "Birth Stone Bracelet", price: "$112", image_url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300", link: "#" },
  { sku: "TG-INIT-01", title: "Initial Necklace", price: "$84", image_url: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=300", link: "#" },
  { sku: "TG-PEARL-01", title: "Pearl Studs", price: "$68", image_url: "https://images.unsplash.com/photo-1535632066274-36ee5b30b859?w=300", link: "#" },
  { sku: "TG-CHARM-01", title: "Charm Anklet", price: "$58", image_url: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=300", link: "#" },
  { sku: "TG-LETTER-01", title: "Letter Necklace", price: "$92", image_url: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=300", link: "#" },
  { sku: "TG-CROSS-01", title: "Cross Pendant", price: "$72", image_url: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=300", link: "#" },
  { sku: "TG-INFINITY-01", title: "Infinity Ring", price: "$64", image_url: "https://images.unsplash.com/photo-1620625515032-6ed0c1790c75?w=300", link: "#" },
];

export function sampleBlueprint(withAssets: boolean): CampaignBlueprint {
  return {
    campaign_id: "cmp_preview",
    lead_value: "joy",
    lead_personalities: ["fun", "warm_hearted"],
    market: "us",
    free_top_text: "FREE DELIVERY",
    promo_details: "Use code: MOM30",
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
        // body_blocks[1] now reads as offer-panel-shaped: short italic
        // intro (rendered at 36px in offer_panel) + huge offer numerals
        // (118px) + brief CTA. Other skeletons that bind body_blocks[1]
        // as paragraph copy will render briefly in the demo — that's a
        // sample-data tradeoff, not a runtime issue. Production copy
        // generation produces body_block shapes per the chosen skeleton.
        title: "Final 24 hours",
        description: "20% OFF",
        cta: "Shop now",
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
    products: SAMPLE_PRODUCTS,
    assets: withAssets
      ? {
          hero: SAMPLE_HERO_URL,
          closing: SAMPLE_CLOSING_URL,
          secondary: SAMPLE_SECONDARY_URL,
          portrait: SAMPLE_PORTRAIT_URL,
        }
      : {},
  };
}
