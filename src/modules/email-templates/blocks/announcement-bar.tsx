import * as React from "react";
import { Section, Text } from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import type { AnnouncementBarProps } from "./types";

export function AnnouncementBar({ text }: AnnouncementBarProps) {
  return (
    <Section
      style={{
        backgroundColor: COLORS.babyBlue,
        padding: "8px 16px",
        textAlign: "center",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: FONTS.body,
          fontSize: "12px",
          fontWeight: 700,
          color: COLORS.black,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {text}
      </Text>
    </Section>
  );
}
