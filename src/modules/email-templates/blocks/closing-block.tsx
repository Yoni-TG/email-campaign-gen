import * as React from "react";
import { Img, Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import { CtaButton } from "./cta-button";
import type { ClosingBlockProps } from "./types";

export function ClosingBlock({
  imageUrl,
  headline,
  body,
  ctaLabel,
  ctaHref,
  background = "baby_blue",
}: ClosingBlockProps) {
  const bg = bgColor(background);
  return (
    <Section
      style={{
        backgroundColor: bg,
        padding: imageUrl ? 0 : "40px 24px",
        textAlign: "center",
      }}
    >
      {imageUrl ? (
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
      ) : null}
      <Section
        style={{
          padding: "32px 24px",
          backgroundColor: bg,
          textAlign: "center",
        }}
      >
        {headline ? (
          <Text
            style={{
              margin: "0 0 12px 0",
              fontFamily: FONTS.display,
              fontSize: "24px",
              color: COLORS.black,
              lineHeight: 1.2,
            }}
          >
            {headline}
          </Text>
        ) : null}
        {body ? (
          <Text
            style={{
              margin: "0 0 16px 0",
              fontFamily: FONTS.body,
              fontSize: "14px",
              color: COLORS.black,
              lineHeight: 1.6,
            }}
          >
            {body}
          </Text>
        ) : null}
        {ctaLabel ? <CtaButton label={ctaLabel} href={ctaHref} /> : null}
      </Section>
    </Section>
  );
}
