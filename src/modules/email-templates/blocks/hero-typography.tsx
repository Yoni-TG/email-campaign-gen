import { Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import { CtaButton } from "./cta-button";
import type { HeroTypographyProps } from "./types";

export function HeroTypography({
  topline,
  headline,
  subhead,
  ctaLabel,
  ctaHref,
  background = "white",
  editTargets,
}: HeroTypographyProps) {
  return (
    <Section
      data-edit-target={editTargets?.background}
      style={{ backgroundColor: bgColor(background), padding: "48px 32px", textAlign: "center" }}
    >
      {topline ? (
        <Text
          data-edit-target={editTargets?.topline}
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
        data-edit-target={editTargets?.headline}
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
          data-edit-target={editTargets?.subhead}
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
      {ctaLabel ? (
        <CtaButton
          label={ctaLabel}
          href={ctaHref}
          editTarget={editTargets?.ctaLabel}
        />
      ) : null}
    </Section>
  );
}
