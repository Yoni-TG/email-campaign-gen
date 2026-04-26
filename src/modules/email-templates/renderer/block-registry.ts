import type { ComponentType } from "react";
import type { BlockType } from "../types";
import type { BlockPropsMap } from "../blocks/types";
import {
  AnnouncementBar,
  ClosingBlock,
  CtaButton,
  EditorialSplit,
  Footer,
  HeroLifestyle,
  HeroProduct,
  HeroTileGraphic,
  HeroTypography,
  LogoHeader,
  NickyQuoteModule,
  ProductGrid2x2,
  ProductGrid3x2,
  ProductGrid4x1,
  ProductGridMagazine,
  SectionLabel,
  TextBlockCentered,
} from "../blocks";

type BlockRegistry = { [T in BlockType]: ComponentType<BlockPropsMap[T]> };

export const blockRegistry: BlockRegistry = {
  logo_header: LogoHeader,
  announcement_bar: AnnouncementBar,
  hero_lifestyle: HeroLifestyle,
  hero_product: HeroProduct,
  hero_typography: HeroTypography,
  hero_tile_graphic: HeroTileGraphic,
  text_block_centered: TextBlockCentered,
  editorial_split: EditorialSplit,
  product_grid_2x2: ProductGrid2x2,
  product_grid_3x2: ProductGrid3x2,
  product_grid_4x1: ProductGrid4x1,
  product_grid_magazine: ProductGridMagazine,
  nicky_quote_module: NickyQuoteModule,
  cta_button: CtaButton,
  section_label: SectionLabel,
  closing_block: ClosingBlock,
  footer: Footer,
};
