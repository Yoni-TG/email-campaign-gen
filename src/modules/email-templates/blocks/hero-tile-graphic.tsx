import * as React from "react";
import { Column, Row, Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import { CtaButton } from "./cta-button";
import type { HeroTileGraphicProps } from "./types";

const TILE_BACKGROUNDS = [COLORS.babyBlue, COLORS.paleBlue, COLORS.midBlue];

export function HeroTileGraphic({
  subLabel,
  headline,
  tiles,
  urgency,
  body,
  ctaLabel,
  ctaHref,
  background = "pale_blue",
  editTargets,
}: HeroTileGraphicProps) {
  const visibleTiles = tiles.slice(0, 3);
  return (
    <Section style={{ backgroundColor: bgColor(background), padding: "32px 24px", textAlign: "center" }}>
      {subLabel ? (
        <Text
          data-edit-target={editTargets?.subLabel}
          style={{
            margin: "0 0 12px 0",
            fontFamily: FONTS.body,
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.black,
          }}
        >
          {subLabel}
        </Text>
      ) : null}
      <Text
        data-edit-target={editTargets?.headline}
        style={{
          margin: "0 0 24px 0",
          fontFamily: FONTS.display,
          fontSize: "32px",
          lineHeight: 1.1,
          color: COLORS.black,
        }}
      >
        {headline}
      </Text>
      <Row>
        {visibleTiles.map((tile, i) => (
          <Column
            key={i}
            style={{
              width: `${100 / visibleTiles.length}%`,
              padding: "8px",
              verticalAlign: "top",
            }}
          >
            <Section
              style={{
                backgroundColor: TILE_BACKGROUNDS[i % TILE_BACKGROUNDS.length],
                padding: "32px 0",
                textAlign: "center",
                border: `1px solid ${COLORS.white}`,
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: FONTS.display,
                  fontSize: "32px",
                  color: COLORS.black,
                }}
              >
                {tile.label}
              </Text>
            </Section>
          </Column>
        ))}
      </Row>
      {urgency ? (
        <Text
          data-edit-target={editTargets?.urgency}
          style={{
            margin: "16px 0 8px 0",
            fontFamily: FONTS.body,
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: COLORS.black,
          }}
        >
          {urgency}
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
          href={ctaHref}
          editTarget={editTargets?.ctaLabel}
        />
      ) : null}
    </Section>
  );
}
