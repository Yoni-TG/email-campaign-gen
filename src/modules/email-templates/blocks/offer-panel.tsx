// Discrete offer strip optimised for big-numerals discount campaigns.
// Five vertical pieces inside one coloured panel:
//
//   1. topline    — small italic intro ("Last Chance to shop the Perfect Gift for Mom")
//   2. headline   — huge serif offer numerals ("$30 OFF")
//   3. subhead    — italic descriptor ("everything") — optional
//   4. code chip  — darker pill with the promo code ("Use code: MOM30") — optional
//   5. ctaButton  — white pill button ("SHOP NOW") routed to ctaHref
//
// The code chip uses a translucent darker overlay of the panel background
// so it reads regardless of which background colour the panel uses. We
// embed the chip inline rather than reusing CtaButton so the styling
// (white pill, plain CTA) and the chip (darker pill, label-only) can sit
// side-by-side without dragging in CtaButton's button-color machinery.

import { Button, Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import type { OfferPanelProps } from "./types";

export function OfferPanel({
  topline,
  headline,
  subhead,
  code,
  ctaLabel,
  ctaHref,
  background = "dusty_rose",
  editTargets,
}: OfferPanelProps) {
  const isLight = background === "white";
  const textColor = isLight ? COLORS.black : COLORS.white;
  // Chip background — slightly darker than the panel so it reads as a chip
  // not a divider. We use a fixed token rather than darken-on-the-fly
  // because email clients don't run CSS filters reliably.
  const chipBg = isLight ? COLORS.paleBlue : "rgba(0, 0, 0, 0.18)";

  return (
    <Section
      data-edit-target={editTargets?.background}
      style={{
        backgroundColor: bgColor(background),
        padding: "36px 24px 36px 24px",
        textAlign: "center",
      }}
    >
      {topline ? (
        <Text
          data-edit-target={editTargets?.topline}
          style={{
            margin: "0 0 10px 0",
            fontFamily: FONTS.display,
            fontStyle: "italic",
            fontSize: "20px",
            color: textColor,
            lineHeight: 1.3,
          }}
        >
          {topline}
        </Text>
      ) : null}
      <Text
        data-edit-target={editTargets?.headline}
        style={{
          margin: 0,
          fontFamily: FONTS.display,
          fontSize: "60px",
          fontWeight: 400,
          letterSpacing: "0.01em",
          color: textColor,
          lineHeight: 1,
        }}
      >
        {headline}
      </Text>
      {subhead ? (
        <Text
          data-edit-target={editTargets?.subhead}
          style={{
            margin: "6px 0 0 0",
            fontFamily: FONTS.display,
            fontStyle: "italic",
            fontSize: "20px",
            color: textColor,
          }}
        >
          {subhead}
        </Text>
      ) : null}
      {code ? (
        <Text
          data-edit-target={editTargets?.code}
          style={{
            margin: "20px 0 0 0",
            display: "inline-block",
            backgroundColor: chipBg,
            color: textColor,
            fontFamily: FONTS.body,
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "8px 18px",
            borderRadius: "999px",
          }}
        >
          {code}
        </Text>
      ) : null}
      {ctaLabel ? (
        <Section style={{ textAlign: "center", padding: "16px 0 0 0" }}>
          <Button
            href={ctaHref || "#"}
            data-edit-target={editTargets?.ctaLabel}
            style={{
              backgroundColor: COLORS.white,
              color: COLORS.black,
              fontFamily: FONTS.body,
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              padding: "14px 36px",
              borderRadius: "999px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            {ctaLabel}
          </Button>
        </Section>
      ) : null}
    </Section>
  );
}
