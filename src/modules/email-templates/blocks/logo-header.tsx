import * as React from "react";
import { Section, Text } from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import type { LogoHeaderProps } from "./types";

export function LogoHeader({ background = "white" }: LogoHeaderProps) {
  const bg = background === "baby_blue" ? COLORS.babyBlue : COLORS.white;
  return (
    <Section
      style={{
        backgroundColor: bg,
        padding: "20px 0",
        textAlign: "center",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: FONTS.display,
          fontSize: "20px",
          color: COLORS.black,
          letterSpacing: "0.04em",
        }}
      >
        theo grace
      </Text>
    </Section>
  );
}
