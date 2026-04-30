import { Column, Img, Row, Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import { CtaButton } from "./cta-button";
import type { HeroProductProps } from "./types";

export function HeroProduct({
  imageUrl,
  headline,
  body,
  ctaLabel,
  ctaHref,
  background = "pale_blue",
  editTargets,
}: HeroProductProps) {
  return (
    <Section
      data-edit-target={editTargets?.background}
      style={{ backgroundColor: bgColor(background), padding: "32px 24px" }}
    >
      <Row>
        <Column style={{ width: "50%", verticalAlign: "middle" }}>
          <Img
            src={imageUrl}
            alt={headline ?? "Product"}
            width="280"
            data-edit-target={editTargets?.imageUrl}
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
              data-edit-target={editTargets?.headline}
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
              data-edit-target={editTargets?.body}
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
          {ctaLabel ? (
            <CtaButton
              label={ctaLabel}
              href={ctaHref || "#"}
              align="left"
              editTarget={editTargets?.ctaLabel}
            />
          ) : null}
        </Column>
      </Row>
    </Section>
  );
}
