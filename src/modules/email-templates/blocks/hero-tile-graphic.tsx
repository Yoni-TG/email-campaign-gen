// Mystery-sale graphic hero — operator uploads a GIF or image (600 × 310 px,
// 2:1 ratio). The whole image is click-through to ctaHref when provided.

import { Img, Link, Section } from "@react-email/components";
import { COLORS } from "./theme";
import type { HeroTileGraphicProps } from "./types";

export function HeroTileGraphic({ imageUrl, ctaHref, editTargets }: HeroTileGraphicProps) {
  const img = (
    <Img
      src={imageUrl}
      alt="Mystery Sale"
      width="600"
      data-edit-target={editTargets?.imageUrl}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        backgroundColor: COLORS.paleBlue,
      }}
    />
  );

  return (
    <Section style={{ padding: "0" }}>
      {ctaHref ? (
        <Link href={ctaHref} style={{ display: "block", textDecoration: "none" }}>
          {img}
        </Link>
      ) : (
        img
      )}
    </Section>
  );
}
