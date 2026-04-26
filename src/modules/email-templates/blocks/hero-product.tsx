import * as React from "react";
import { Column, Img, Row, Section, Text } from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import { CtaButton } from "./cta-button";
import type { HeroProductProps } from "./types";

export function HeroProduct({ imageUrl, headline, body, cta }: HeroProductProps) {
  return (
    <Section style={{ backgroundColor: COLORS.babyBlue, padding: "32px 24px" }}>
      <Row>
        <Column style={{ width: "50%", verticalAlign: "middle" }}>
          <Img
            src={imageUrl}
            alt={headline ?? "Product"}
            width="280"
            style={{
              display: "block",
              width: "100%",
              maxWidth: "280px",
              height: "auto",
              margin: "0 auto",
            }}
          />
        </Column>
        <Column style={{ width: "50%", verticalAlign: "middle", paddingLeft: "16px" }}>
          {headline ? (
            <Text
              style={{
                margin: "0 0 12px 0",
                fontFamily: FONTS.display,
                fontSize: "28px",
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
          {cta ? <CtaButton label={cta.label} href={cta.href} align="left" /> : null}
        </Column>
      </Row>
    </Section>
  );
}
