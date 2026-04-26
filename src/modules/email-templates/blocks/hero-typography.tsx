import * as React from "react";
import { Section, Text } from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import { CtaButton } from "./cta-button";
import type { HeroTypographyProps } from "./types";

export function HeroTypography({
  topline,
  headline,
  subhead,
  ctaLabel,
  ctaHref,
  background = "white",
}: HeroTypographyProps) {
  const bg =
    background === "baby_blue"
      ? COLORS.babyBlue
      : background === "pale_blue"
        ? COLORS.paleBlue
        : COLORS.white;
  return (
    <Section style={{ backgroundColor: bg, padding: "48px 32px", textAlign: "center" }}>
      {topline ? (
        <Text
          style={{
            margin: "0 0 16px 0",
            fontFamily: FONTS.body,
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLORS.black,
          }}
        >
          {topline}
        </Text>
      ) : null}
      <Text
        style={{
          margin: "0 0 12px 0",
          fontFamily: FONTS.display,
          fontSize: "44px",
          lineHeight: 1.05,
          color: COLORS.black,
          letterSpacing: "0.01em",
        }}
      >
        {headline}
      </Text>
      {subhead ? (
        <Text
          style={{
            margin: "0 0 24px 0",
            fontFamily: FONTS.body,
            fontSize: "14px",
            color: COLORS.black,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          {subhead}
        </Text>
      ) : null}
      {ctaLabel ? <CtaButton label={ctaLabel} href={ctaHref} /> : null}
    </Section>
  );
}
