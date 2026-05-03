// Composite "everything-on-the-photo" sale hero. A single Section paints
// the lifestyle image as the visual base; absolute-positioned children
// stack on top in three regions:
//
//   • Top region   — title pair (`topline` + optional `subline`)
//   • Mid-bottom   — offer composition (italic intro + huge numerals +
//                    italic descriptor + optional code chip + optional
//                    CTA button)
//   • Bottom strip — optional dark band carrying a label ("Jewellery for
//                    family time"). Visually grounds the hero before the
//                    body grids below.
//
// Layout is identical to hero_titled_image's overlay-bottom mode: a
// relative `<div>` holds the `<Img>` and the absolute-positioned overlay
// `<div>`s. Modern email clients honour `position` on `<div>` reliably;
// Outlook desktop ignores absolute positioning and the overlays fall
// back to a stack below the image — the message still reads, just
// without the visual layering.
//
// Designed for sale-promo and holiday-sale heroes where the photo is
// the emotional anchor and the offer + CTA need to live on top of it.

import { Img, Section, Text } from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import type { HeroOfferOverlayProps } from "./types";

export function HeroOfferOverlay({
  imageUrl,
  topline,
  subline,
  offerTopline,
  offerHeadline,
  offerSubhead,
  code,
  ctaLabel,
  ctaHref,
  editTargets,
}: HeroOfferOverlayProps) {
  return (
    <Section
      data-edit-target={editTargets?.background}
      style={{ padding: 0 }}
    >
      <div style={{ position: "relative", width: "100%", display: "block" }}>
        <Img
          src={imageUrl}
          alt={offerHeadline ?? topline ?? ""}
          width="640"
          data-edit-target={editTargets?.imageUrl}
          style={{
            display: "block",
            width: "100%",
            maxWidth: "640px",
            height: "auto",
            margin: 0,
          }}
        />

        {/* Top region — title pair anchored to the upper portion of the image. */}
        {topline ? (
          <div
            style={{
              position: "absolute",
              top: "8%",
              left: 0,
              right: 0,
              textAlign: "center",
              padding: "0 24px",
              color: COLORS.white,
              textShadow: "0 1px 8px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              data-edit-target={editTargets?.topline}
              style={{
                fontFamily: FONTS.display,
                fontStyle: "italic",
                fontSize: "32px",
                lineHeight: 1.2,
              }}
            >
              {topline}
            </div>
            {subline ? (
              <div
                data-edit-target={editTargets?.subline}
                style={{
                  marginTop: "4px",
                  fontFamily: FONTS.display,
                  fontStyle: "italic",
                  fontSize: "32px",
                  lineHeight: 1.2,
                }}
              >
                {subline}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Bottom region — offer composition + chip + CTA. Anchored at
            roughly 18% from the bottom so the band (when present) has
            room without overlapping the offer. */}
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: 0,
            right: 0,
            textAlign: "center",
            padding: "0 24px",
            color: COLORS.white,
            textShadow: "0 1px 8px rgba(0, 0, 0, 0.35)",
          }}
        >
          {offerTopline ? (
            <div
              data-edit-target={editTargets?.offerTopline}
              style={{
                fontFamily: FONTS.display,
                fontStyle: "italic",
                fontSize: "20px",
                lineHeight: 1.3,
                marginBottom: "4px",
              }}
            >
              {offerTopline}
            </div>
          ) : null}
          <div
            data-edit-target={editTargets?.offerHeadline}
            style={{
              fontFamily: FONTS.display,
              fontSize: "60px",
              lineHeight: 1,
              letterSpacing: "0.01em",
            }}
          >
            {offerHeadline}
          </div>
          {offerSubhead ? (
            <div
              data-edit-target={editTargets?.offerSubhead}
              style={{
                marginTop: "6px",
                fontFamily: FONTS.display,
                fontStyle: "italic",
                fontSize: "20px",
              }}
            >
              {offerSubhead}
            </div>
          ) : null}
          {code ? (
            <div style={{ marginTop: "16px" }}>
              <span
                data-edit-target={editTargets?.code}
                style={{
                  display: "inline-block",
                  backgroundColor: COLORS.white,
                  color: COLORS.black,
                  fontFamily: FONTS.body,
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "8px 18px",
                  borderRadius: "999px",
                  textShadow: "none",
                }}
              >
                {code}
              </span>
            </div>
          ) : null}
          {ctaLabel ? (
            <div style={{ marginTop: "12px" }}>
              <a
                href={ctaHref || "#"}
                data-edit-target={editTargets?.ctaLabel}
                style={{
                  display: "inline-block",
                  backgroundColor: COLORS.white,
                  color: COLORS.black,
                  fontFamily: FONTS.body,
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  padding: "12px 28px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  textShadow: "none",
                }}
              >
                {ctaLabel}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
