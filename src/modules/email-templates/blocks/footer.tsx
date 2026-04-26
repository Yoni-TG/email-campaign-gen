import * as React from "react";
import { Hr, Link, Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import type { FooterProps } from "./types";

const DEFAULT_LEGAL =
  "You're receiving this email because you opted in at theograce.com. " +
  "Theo Grace, 1 Brand Way, New York, NY.";

export function Footer({
  legalText = DEFAULT_LEGAL,
  background = "pale_blue",
}: FooterProps) {
  return (
    <Section
      style={{
        backgroundColor: bgColor(background),
        padding: "32px 24px",
        textAlign: "center",
      }}
    >
      <Text
        style={{
          margin: "0 0 12px 0",
          fontFamily: FONTS.display,
          fontSize: "14px",
          color: COLORS.black,
          letterSpacing: "0.04em",
        }}
      >
        theo grace
      </Text>
      <Text
        style={{
          margin: "0 0 16px 0",
          fontFamily: FONTS.body,
          fontSize: "12px",
          color: COLORS.black,
        }}
      >
        <Link
          href="https://theograce.com/shop"
          style={{ color: COLORS.black, textDecoration: "none", padding: "0 8px" }}
        >
          Shop
        </Link>
        <Link
          href="https://theograce.com/about"
          style={{ color: COLORS.black, textDecoration: "none", padding: "0 8px" }}
        >
          About
        </Link>
        <Link
          href="https://theograce.com/contact"
          style={{ color: COLORS.black, textDecoration: "none", padding: "0 8px" }}
        >
          Contact
        </Link>
      </Text>
      <Hr style={{ borderColor: COLORS.midBlue, opacity: 0.3, margin: "16px auto", width: "60%" }} />
      <Text
        style={{
          margin: 0,
          fontFamily: FONTS.body,
          fontSize: "10px",
          color: COLORS.black,
          lineHeight: 1.5,
        }}
      >
        {legalText}
        <br />
        <Link
          href="{% unsubscribe %}"
          style={{ color: COLORS.black, textDecoration: "underline" }}
        >
          Unsubscribe
        </Link>
      </Text>
    </Section>
  );
}
