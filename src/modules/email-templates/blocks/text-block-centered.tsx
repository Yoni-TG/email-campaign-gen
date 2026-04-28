import { Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import { CtaButton } from "./cta-button";
import { SectionLabel } from "./section-label";
import type { TextBlockCenteredProps } from "./types";

export function TextBlockCentered({
  subLabel,
  headline,
  body,
  ctaLabel,
  ctaHref,
  background = "white",
  editTargets,
}: TextBlockCenteredProps) {
  return (
    <Section
      data-edit-target={editTargets?.background}
      style={{
        backgroundColor: bgColor(background),
        padding: "40px 32px",
        textAlign: "center",
      }}
    >
      <Section style={{ maxWidth: "560px", margin: "0 auto" }}>
        {subLabel ? (
          <SectionLabel text={subLabel} editTarget={editTargets?.subLabel} />
        ) : null}
        {headline ? (
          <Text
            data-edit-target={editTargets?.headline}
            style={{
              margin: "0 0 16px 0",
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
              fontSize: "15px",
              color: COLORS.black,
              lineHeight: 1.65,
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
    </Section>
  );
}
