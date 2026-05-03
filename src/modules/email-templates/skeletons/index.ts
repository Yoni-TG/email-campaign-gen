// Loads all skeleton manifests bundled with the app. Adding a new skeleton:
// drop a JSON file under skeletons/<campaign-type>/<id>.json and add it to
// the import + array below. The shape is enforced via the SkeletonManifest
// cast — TypeScript's structural check catches malformed manifests at build.

import type { SkeletonManifest } from "../types";

import productLaunchHeroStoryGrid from "./product-launch/hero-story-grid.json";
import productLaunchEditorialLed from "./product-launch/editorial-led.json";
import productLaunchGridForward from "./product-launch/grid-forward.json";

import salePromoMysteryTiles from "./sale-promo/mystery-tiles.json";
import salePromoTypographyBanner from "./sale-promo/typography-banner.json";
import salePromoPhotoOverlay from "./sale-promo/photo-overlay-offer.json";
import salePromoBigMothersDayOverlay from "./sale-promo/big-mothers-day-overlay.json";

import editorialNarrativeLed from "./editorial/narrative-led.json";
import editorialNickyLed from "./editorial/nicky-led.json";
import editorialGalleryEdit from "./editorial/gallery-edit.json";

import collectionHero from "./collection-spotlight/collection-hero.json";
import collectionTierGrouped from "./collection-spotlight/tier-grouped.json";
import collectionQuoteLed from "./collection-spotlight/quote-led.json";

import holidayGiftGuide from "./holiday-seasonal/gift-guide.json";
import holidayUrgencyBanner from "./holiday-seasonal/urgency-banner.json";
import holidayWarmWish from "./holiday-seasonal/warm-wish.json";
import holidayLastCallOffer from "./holiday-seasonal/last-call-offer.json";
import holidayLastCallOverlay from "./holiday-seasonal/last-call-overlay.json";

const ALL_SKELETONS: readonly SkeletonManifest[] = [
  productLaunchHeroStoryGrid,
  productLaunchEditorialLed,
  productLaunchGridForward,
  salePromoMysteryTiles,
  salePromoTypographyBanner,
  salePromoPhotoOverlay,
  salePromoBigMothersDayOverlay,
  editorialNarrativeLed,
  editorialNickyLed,
  editorialGalleryEdit,
  collectionHero,
  collectionTierGrouped,
  collectionQuoteLed,
  holidayGiftGuide,
  holidayUrgencyBanner,
  holidayWarmWish,
  holidayLastCallOffer,
  holidayLastCallOverlay,
] as SkeletonManifest[];

export function loadAllSkeletons(): SkeletonManifest[] {
  return [...ALL_SKELETONS];
}

export function loadSkeletonById(id: string): SkeletonManifest | null {
  return ALL_SKELETONS.find((s) => s.id === id) ?? null;
}
