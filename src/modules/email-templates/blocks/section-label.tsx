import { Text } from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import type { SectionLabelProps } from "./types";

export function SectionLabel({
  text,
  align = "center",
  editTarget,
}: SectionLabelProps) {
  return (
    <Text
      data-edit-target={editTarget}
      style={{
        margin: "0 0 12px 0",
        fontFamily: FONTS.body,
        fontSize: "12px",
        fontWeight: 700,
        color: COLORS.black,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        textAlign: align,
      }}
    >
      {text}
    </Text>
  );
}
