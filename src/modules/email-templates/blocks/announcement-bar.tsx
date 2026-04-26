import { Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import type { AnnouncementBarProps } from "./types";

export function AnnouncementBar({ text, background = "baby_blue" }: AnnouncementBarProps) {
  return (
    <Section
      style={{
        backgroundColor: bgColor(background),
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
