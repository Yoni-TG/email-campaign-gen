import { Column, Img, Row, Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import { CtaButton } from "./cta-button";
import { SectionLabel } from "./section-label";
import type { EditorialSplitProps } from "./types";

export function EditorialSplit({
  imageUrl,
  imageSide = "left",
  subLabel,
  headline,
  body,
  ctaLabel,
  ctaHref,
  background = "white",
  editTargets,
}: EditorialSplitProps) {
  const imageColumn = (
    <Column key="image" style={{ width: "50%", verticalAlign: "middle" }}>
      <Img
        src={imageUrl}
        alt={headline ?? ""}
        width="320"
        data-edit-target={editTargets?.imageUrl}
        style={{
          display: "block",
          width: "100%",
          maxWidth: "320px",
          height: "auto",
          margin: 0,
        }}
      />
    </Column>
  );
  const textColumn = (
    <Column
      key="text"
      style={{
        width: "50%",
        verticalAlign: "middle",
        padding: imageSide === "left" ? "24px 24px 24px 16px" : "24px 16px 24px 24px",
      }}
    >
      {subLabel ? (
        <SectionLabel
          text={subLabel}
          align="left"
          editTarget={editTargets?.subLabel}
        />
      ) : null}
      {headline ? (
        <Text
          data-edit-target={editTargets?.headline}
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
          align="left"
          editTarget={editTargets?.ctaLabel}
        />
      ) : null}
    </Column>
  );
  return (
    <Section
      data-edit-target={editTargets?.background}
      style={{ backgroundColor: bgColor(background), padding: "24px 0" }}
    >
      <Row>{imageSide === "left" ? [imageColumn, textColumn] : [textColumn, imageColumn]}</Row>
    </Section>
  );
}
