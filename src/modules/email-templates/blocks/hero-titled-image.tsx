// Hero block that pairs a centered serif headline with a full-width
// lifestyle image. Two layout modes:
//
//   titlePosition: "above"          — headline panel sits above the image.
//                                     Default. The Mother's-Day-Last-Call
//                                     screenshot 1 build.
//   titlePosition: "overlay-bottom" — headline absolute-positions over
//                                     the lower-center of the image in
//                                     white serif. Screenshot 2 build.
//                                     Outlook desktop falls back to a
//                                     panel below the image (graceful
//                                     degradation — Outlook ignores
//                                     absolute positioning).
//
// Either mode honours `background` (panel colour for `above`; the
// lower-bleed gradient for `overlay-bottom`). The headline reads white
// over any non-white panel and stays black over `white`, so contrast is
// automatic when operators tune the panel via fine-tune.
//
// `position: relative` is set on a wrapping `<div>` rather than the
// react-email `<Section>` because Section emits a `<table>` and table
// positioning is unreliable across Gmail / Outlook / Apple Mail. Modern
// email clients honour `position: relative/absolute` on `<div>` reliably.

import { Img, Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import { SectionLabel } from "./section-label";
import type { HeroTitledImageProps } from "./types";

export function HeroTitledImage({
  imageUrl,
  subLabel,
  headline,
  background = "white",
  titlePosition = "above",
  editTargets,
}: HeroTitledImageProps) {
  const isLight = background === "white";
  const headlineColor = isLight ? COLORS.black : COLORS.white;

  if (titlePosition === "overlay-bottom") {
    return (
      <Section
        data-edit-target={editTargets?.background}
        style={{
          backgroundColor: bgColor(background),
          padding: 0,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            display: "block",
          }}
        >
          <Img
            src={imageUrl}
            alt={headline ?? ""}
            width="640"
            data-edit-target={editTargets?.imageUrl}
            style={{
              display: "block",
              width: "100%",
              maxWidth: "640px",
              height: "auto",
              margin: 0,
            }}
          />
          <div
            data-edit-target={editTargets?.headline}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              // Sit in the lower third of the image — high enough to read
              // against most lifestyle photos, low enough to leave the
              // subject framed in the upper portion.
              bottom: "18%",
              textAlign: "center",
              padding: "0 24px",
              fontFamily: FONTS.display,
              fontSize: "35px",
              lineHeight: 1.15,
              // Always white on overlay so the headline reads against
              // photo-driven backgrounds. Operators tune contrast by
              // picking a darker hero, not by changing this colour.
              color: COLORS.white,
              // Soft shadow gives readability against bright photo
              // areas without painting a visible box.
              textShadow: "0 1px 8px rgba(0, 0, 0, 0.35)",
            }}
          >
            {subLabel ? (
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  color: COLORS.white,
                }}
              >
                {subLabel}
              </div>
            ) : null}
            {headline}
          </div>
        </div>
      </Section>
    );
  }

  // titlePosition === "above" (default — backward compatible)
  return (
    <>
      <Section
        data-edit-target={editTargets?.background}
        style={{
          backgroundColor: bgColor(background),
          padding: "32px 24px 28px 24px",
          textAlign: "center",
        }}
      >
        {subLabel ? (
          <SectionLabel text={subLabel} editTarget={editTargets?.subLabel} />
        ) : null}
        <Text
          data-edit-target={editTargets?.headline}
          style={{
            margin: 0,
            fontFamily: FONTS.display,
            fontSize: "35px",
            color: headlineColor,
            lineHeight: 1.15,
          }}
        >
          {headline}
        </Text>
      </Section>
      <Img
        src={imageUrl}
        alt={headline ?? ""}
        width="640"
        data-edit-target={editTargets?.imageUrl}
        style={{
          display: "block",
          width: "100%",
          maxWidth: "640px",
          height: "auto",
          margin: 0,
        }}
      />
    </>
  );
}
