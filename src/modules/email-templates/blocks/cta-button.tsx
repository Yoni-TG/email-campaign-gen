import { Button, Section } from "@react-email/components";
import { COLORS, FONTS, buttonColorHex } from "./theme";
import type { CtaButtonProps } from "./types";

export function CtaButton({
  label,
  href = "#",
  align = "center",
  buttonColor = "ink",
  editTarget,
}: CtaButtonProps) {
  return (
    <Section style={{ textAlign: align, padding: "16px 0" }}>
      <Button
        href={href}
        data-edit-target={editTarget}
        style={{
          backgroundColor: buttonColorHex(buttonColor),
          color: COLORS.white,
          fontFamily: FONTS.body,
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "14px 28px",
          borderRadius: "999px",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        {label}
      </Button>
    </Section>
  );
}
