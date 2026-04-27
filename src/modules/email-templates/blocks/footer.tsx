import * as React from "react";
import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import type {
  FooterExperienceItem,
  FooterPressLogo,
  FooterProps,
} from "./types";

// ─── Brand defaults (overridable via props) ─────────────────────────────────
//
// These are the brand's canonical footer assets. Asset URLs are placeholders
// that should resolve to real Theo Grace CDN paths once the brand uploads
// them. Until then, swap them via the `experience` / `pressLogos` /
// `logoImageUrl` props or replace them in this file.

const DEFAULT_EXPERIENCE: FooterExperienceItem[] = [
  {
    iconUrl: "https://theograce.com/email-assets/footer/free-shipping.png",
    label: "Free Shipping",
  },
  {
    iconUrl: "https://theograce.com/email-assets/footer/100-day-returns.png",
    label: "100-Day Returns",
  },
  {
    iconUrl: "https://theograce.com/email-assets/footer/2-year-warranty.png",
    label: "2-Year Warranty",
  },
  {
    iconUrl: "https://theograce.com/email-assets/footer/free-engraving.png",
    label: "Free Engraving",
  },
];

const DEFAULT_PRESS_LOGOS: FooterPressLogo[] = [
  { url: "https://theograce.com/email-assets/press/cosmopolitan.png", alt: "Cosmopolitan" },
  { url: "https://theograce.com/email-assets/press/popsugar.png", alt: "Popsugar" },
  { url: "https://theograce.com/email-assets/press/forbes.png", alt: "Forbes" },
  { url: "https://theograce.com/email-assets/press/daily.png", alt: "Daily" },
  { url: "https://theograce.com/email-assets/press/the-knot.png", alt: "The Knot" },
  { url: "https://theograce.com/email-assets/press/today.png", alt: "TODAY" },
];

const DEFAULT_DISCLAIMER =
  "Discount applied at checkout. This is a limited time offer. Free gift and " +
  "coupon codes are not stackable or applicable to past orders. Free gifts " +
  "cannot be returned for refund or exchange. Offers are valid for 24 hours " +
  "only unless otherwise stated.";

const DEFAULT_ADDRESS = "US 600 N Broad St. Suite 5 #3235 Middletown, Delaware 19709";

// Brand social URLs — match the HTML the brand provided. The icon images
// are hosted on Klaviyo's d3k81ch9hvuctc CDN today; we keep those URLs
// because the icons are pre-themed (black on transparent) and reaching
// for a different CDN would just be moving them for no reason.
const SOCIAL_LINKS = [
  {
    href: "https://www.facebook.com/theograceco/",
    iconUrl: "https://d3k81ch9hvuctc.cloudfront.net/assets/email/buttons/black/facebook_96.png",
    alt: "Facebook",
  },
  {
    href: "https://www.instagram.com/theograceofficial/",
    iconUrl: "https://d3k81ch9hvuctc.cloudfront.net/assets/email/buttons/black/instagram_96.png",
    alt: "Instagram",
  },
  {
    href: "https://www.tiktok.com/@theograceofficial",
    iconUrl: "https://d3k81ch9hvuctc.cloudfront.net/assets/email/buttons/black/tiktok_96.png",
    alt: "TikTok",
  },
  {
    href: "https://www.pinterest.com/theograceofficial/",
    iconUrl: "https://d3k81ch9hvuctc.cloudfront.net/assets/email/buttons/black/pinterest_96.png",
    alt: "Pinterest",
  },
] as const;

const COPYRIGHT_START_YEAR = 2006;

// ─── Component ─────────────────────────────────────────────────────────────

export function Footer({
  experience = DEFAULT_EXPERIENCE,
  pressLogos = DEFAULT_PRESS_LOGOS,
  disclaimer = DEFAULT_DISCLAIMER,
  logoImageUrl,
  privacyHref = "https://theograce.com/privacy",
  address = DEFAULT_ADDRESS,
  editTargets,
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const pressTopRow = pressLogos.slice(0, 3);
  const pressBottomRow = pressLogos.slice(3, 6);

  return (
    <>
      {/* 1. Experience strip — white */}
      <Section
        style={{ backgroundColor: COLORS.white, padding: "32px 24px 28px" }}
      >
        <Text
          style={{
            margin: "0 0 24px 0",
            fontFamily: FONTS.display,
            fontSize: "22px",
            color: COLORS.black,
            textAlign: "center",
            letterSpacing: "0.01em",
          }}
        >
          The Theo Grace Experience
        </Text>
        <Row>
          {experience.map((item, idx) => (
            <Column
              key={`${item.label}-${idx}`}
              align="center"
              style={{ verticalAlign: "top" }}
            >
              <Img
                src={item.iconUrl}
                alt={item.label}
                width={48}
                height={48}
                style={{ display: "block", margin: "0 auto 8px" }}
              />
              <Text
                style={{
                  margin: 0,
                  fontFamily: FONTS.body,
                  fontSize: "13px",
                  color: COLORS.black,
                  textAlign: "center",
                }}
              >
                {item.label}
              </Text>
            </Column>
          ))}
        </Row>
      </Section>

      {/* 2. As Seen On — pale blue */}
      <Section
        data-edit-target={editTargets?.background}
        style={{ backgroundColor: COLORS.paleBlue, padding: "32px 24px 16px" }}
      >
        <Text
          style={{
            margin: "0 0 20px 0",
            fontFamily: FONTS.display,
            fontSize: "22px",
            color: COLORS.black,
            textAlign: "center",
            letterSpacing: "0.01em",
          }}
        >
          As Seen On
        </Text>
        {pressTopRow.length > 0 && (
          <Row style={{ marginBottom: pressBottomRow.length > 0 ? "16px" : 0 }}>
            {pressTopRow.map((logo, idx) => (
              <Column
                key={`top-${idx}`}
                align="center"
                style={{ verticalAlign: "middle" }}
              >
                <Img
                  src={logo.url}
                  alt={logo.alt}
                  height={22}
                  style={{ display: "block", margin: "0 auto" }}
                />
              </Column>
            ))}
          </Row>
        )}
        {pressBottomRow.length > 0 && (
          <Row>
            {pressBottomRow.map((logo, idx) => (
              <Column
                key={`bottom-${idx}`}
                align="center"
                style={{ verticalAlign: "middle" }}
              >
                <Img
                  src={logo.url}
                  alt={logo.alt}
                  height={22}
                  style={{ display: "block", margin: "0 auto" }}
                />
              </Column>
            ))}
          </Row>
        )}
      </Section>

      <Section style={{ backgroundColor: COLORS.paleBlue, padding: "0 24px" }}>
        <Hr
          style={{
            borderColor: COLORS.midBlue,
            opacity: 0.3,
            margin: "8px auto",
            width: "100%",
          }}
        />
      </Section>

      {/* 3. Social icons — pale blue */}
      <Section
        style={{
          backgroundColor: COLORS.paleBlue,
          padding: "16px 24px",
          textAlign: "center",
        }}
      >
        <table
          role="presentation"
          align="center"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          style={{ margin: "0 auto", borderCollapse: "collapse" }}
        >
          <tbody>
            <tr>
              {SOCIAL_LINKS.map((social, idx) => (
                <td
                  key={social.alt}
                  align="center"
                  style={{
                    padding: idx === SOCIAL_LINKS.length - 1 ? 0 : "0 20px 0 0",
                    lineHeight: 0,
                  }}
                >
                  <table
                    role="presentation"
                    cellPadding={0}
                    cellSpacing={0}
                    border={0}
                    style={{
                      borderCollapse: "separate",
                      backgroundColor: COLORS.paleBlue,
                      borderRadius: 999,
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ padding: 8, lineHeight: 0 }}>
                          <Link
                            href={social.href}
                            style={{ textDecoration: "none" }}
                          >
                            <Img
                              src={social.iconUrl}
                              alt={social.alt}
                              width={24}
                              height={24}
                              style={{
                                display: "block",
                                border: 0,
                                outline: "none",
                              }}
                            />
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Section>

      {/* 4. Disclaimer (optional) — pale blue */}
      {disclaimer && (
        <Section
          style={{
            backgroundColor: COLORS.paleBlue,
            padding: "16px 32px 24px",
          }}
        >
          <Text
            style={{
              margin: 0,
              fontFamily: FONTS.body,
              fontSize: "12px",
              color: COLORS.black,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            {disclaimer}
          </Text>
        </Section>
      )}

      {/* 5. Wordmark — pale blue */}
      <Section
        style={{
          backgroundColor: COLORS.paleBlue,
          padding: "16px 24px 8px",
          textAlign: "center",
        }}
      >
        {logoImageUrl ? (
          <Img
            src={logoImageUrl}
            alt="Theo Grace"
            height={40}
            style={{ display: "block", margin: "0 auto" }}
          />
        ) : (
          <Text
            style={{
              margin: 0,
              fontFamily: FONTS.display,
              fontSize: "20px",
              color: COLORS.black,
              letterSpacing: "0.04em",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            theo grace
          </Text>
        )}
      </Section>

      {/* 6. Legal strip — pale blue */}
      <Section
        style={{
          backgroundColor: COLORS.paleBlue,
          padding: "8px 24px 32px",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: "0 0 8px 0",
            fontFamily: FONTS.body,
            fontSize: "12px",
            color: COLORS.black,
          }}
        >
          {"{% unsubscribe '"}
          <Link
            href="{% unsubscribe %}"
            style={{
              color: COLORS.black,
              textDecoration: "underline",
            }}
          >
            Unsubscribe
          </Link>
          {"' %} | "}
          <Link
            href={privacyHref}
            style={{
              color: COLORS.black,
              textDecoration: "underline",
            }}
          >
            Privacy Policy
          </Link>
        </Text>
        <Text
          style={{
            margin: "8px 0 4px 0",
            fontFamily: FONTS.body,
            fontSize: "12px",
            color: COLORS.black,
          }}
        >
          Copyright © {COPYRIGHT_START_YEAR}–{currentYear} Theo Grace
        </Text>
        <Text
          style={{
            margin: 0,
            fontFamily: FONTS.body,
            fontSize: "12px",
            color: COLORS.black,
          }}
        >
          {address}
        </Text>
      </Section>
    </>
  );
}
