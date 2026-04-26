import * as React from "react";
import { Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import type { LogoHeaderProps } from "./types";

// Brand default is baby-blue per the wireframes — the logo bar is the visual
// anchor that signals Theo Grace before any copy. Pass `background="white"`
// for skeletons that intentionally lead with a typography hero on white.
export function LogoHeader({ background = "baby_blue" }: LogoHeaderProps) {
  const bg = bgColor(background);
  return (
    <Section
      style={{
        backgroundColor: bg,
        padding: "16px 0",
        textAlign: "center",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: FONTS.display,
          fontSize: "22px",
          color: COLORS.black,
          letterSpacing: "0.02em",
        }}
      >
        theo grace
      </Text>
    </Section>
  );
}
