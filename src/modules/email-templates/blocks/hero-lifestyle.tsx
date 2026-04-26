import * as React from "react";
import { Img, Section, Text } from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import { CtaButton } from "./cta-button";
import { SectionLabel } from "./section-label";
import type { HeroLifestyleProps } from "./types";

export function HeroLifestyle({
  imageUrl,
  subLabel,
  headline,
  body,
  ctaLabel,
  ctaHref,
}: HeroLifestyleProps) {
  return (
    <>
      <Img
        src={imageUrl}
        alt={headline ?? ""}
        width="640"
        style={{
          display: "block",
          width: "100%",
          maxWidth: "640px",
          height: "auto",
          margin: 0,
        }}
      />
      <Section
        style={{
          backgroundColor: COLORS.white,
          padding: "32px 32px 24px 32px",
          textAlign: "center",
        }}
      >
        {subLabel ? <SectionLabel text={subLabel} /> : null}
        {headline ? (
          <Text
            style={{
              margin: "0 0 16px 0",
              fontFamily: FONTS.display,
              fontSize: "32px",
              color: COLORS.black,
              lineHeight: 1.15,
            }}
          >
            {headline}
          </Text>
        ) : null}
        {body ? (
          <Text
            style={{
              margin: "0 0 20px 0",
              fontFamily: FONTS.body,
              fontSize: "15px",
              color: COLORS.black,
              lineHeight: 1.6,
            }}
          >
            {body}
          </Text>
        ) : null}
        {ctaLabel ? <CtaButton label={ctaLabel} href={ctaHref} /> : null}
      </Section>
    </>
  );
}
