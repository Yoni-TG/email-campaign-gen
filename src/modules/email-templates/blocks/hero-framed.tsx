import { Img, Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import { CtaButton } from "./cta-button";
import { SectionLabel } from "./section-label";
import type { HeroFramedProps } from "./types";

// "Framed" hero — image sits inside a brand-coloured outer frame, with the
// sub-label / headline / body / CTA stacked below it in the same frame.
// Distinct from hero_lifestyle (image is edge-to-edge there, white card
// stacks below). Use when the visual identity wants the brand colour
// wrapping both the image and the supporting copy.
//
// Any "text on image" effect is operator-baked into the image asset —
// email-client support for absolute positioning is poor, so the block
// doesn't attempt overlay text in HTML.
export function HeroFramed({
  imageUrl,
  subLabel,
  headline,
  body,
  ctaLabel,
  ctaHref,
  background = "baby_blue",
  editTargets,
}: HeroFramedProps) {
  return (
    <Section
      data-edit-target={editTargets?.background}
      style={{
        backgroundColor: bgColor(background),
        padding: "24px 24px 36px 24px",
        textAlign: "center",
      }}
    >
      <Img
        src={imageUrl}
        alt={headline ?? ""}
        width="568"
        data-edit-target={editTargets?.imageUrl}
        style={{
          display: "block",
          width: "100%",
          maxWidth: "600px",
          height: "auto",
          margin: "0 auto",
          marginBottom: "36px",
          backgroundColor: COLORS.paleBlue,
        }}
      />
      {subLabel ? (
        <SectionLabel text={subLabel} editTarget={editTargets?.subLabel} />
      ) : null}
      {headline ? (
        <Text
          data-edit-target={editTargets?.headline}
          style={{
            margin: "0 0 12px 0",
            fontFamily: FONTS.display,
            fontSize: "26px",
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
            maxWidth: "440px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {body}
        </Text>
      ) : null}
      {ctaLabel ? (
        <CtaButton
          label={ctaLabel}
          href={ctaHref || "#"}
          editTarget={editTargets?.ctaLabel}
        />
      ) : null}
    </Section>
  );
}
