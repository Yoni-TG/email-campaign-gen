import { Hr, Img, Link, Section, Text } from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import type { FooterProps } from "./types";

// ─── Asset URL resolution ──────────────────────────────────────────────────
//
// Source images live at src/modules/email-templates/assets/ and are
// copied to public/email-assets/ at build time so Next.js can serve
// them. For dev preview at /blocks the relative path resolves under
// the same origin. For production sends, set
// NEXT_PUBLIC_EMAIL_ASSETS_BASE_URL to your CDN (e.g.
// https://cdn.theograce.com) — the renderer will produce absolute
// URLs that email clients can fetch.

function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_EMAIL_ASSETS_BASE_URL ?? "";
  return `${base}${path}`;
}

const DEFAULT_EXPERIENCE_IMAGE = asset("/email-assets/tgr-experience.png");
const DEFAULT_PRESS_LOGOS_IMAGE = asset("/email-assets/footer-as-seen.png");
const DEFAULT_LOGO_IMAGE = asset("/email-assets/tgr-logo.png");

// ─── Static brand text ─────────────────────────────────────────────────────

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

// Width of the composite strip images. The container is 640px; we
// pad by 24px on each side, so 560 leaves a small breathing margin
// and stays within the safe content area for every major email client.
const STRIP_IMAGE_WIDTH = 560;

// ─── Component ─────────────────────────────────────────────────────────────

export function Footer({
  experienceImageUrl = DEFAULT_EXPERIENCE_IMAGE,
  pressLogosImageUrl = DEFAULT_PRESS_LOGOS_IMAGE,
  disclaimer = DEFAULT_DISCLAIMER,
  logoImageUrl = DEFAULT_LOGO_IMAGE,
  privacyHref = "https://theograce.com/privacy",
  address = DEFAULT_ADDRESS,
  editTargets,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* 1. Experience composite — white */}
      <Section
        style={{
          backgroundColor: COLORS.white,
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <Img
          src={experienceImageUrl}
          alt="The Theo Grace Experience: Free Shipping, 100-Day Returns, 2-Year Warranty, Free Engraving"
          width={STRIP_IMAGE_WIDTH}
          style={{
            display: "block",
            margin: "0 auto",
            maxWidth: "100%",
            height: "auto",
          }}
        />
      </Section>

      {/* 2. As Seen On composite — pale blue */}
      <Section
        data-edit-target={editTargets?.background}
        style={{
          backgroundColor: COLORS.paleBlue,
          padding: "32px 24px 16px",
          textAlign: "center",
        }}
      >
        <Img
          src={pressLogosImageUrl}
          alt="As Seen On: Cosmopolitan, Popsugar, Forbes, Daily, The Knot, TODAY"
          width={STRIP_IMAGE_WIDTH}
          style={{
            display: "block",
            margin: "0 auto",
            maxWidth: "100%",
            height: "auto",
          }}
        />
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
        <Img
          src={logoImageUrl}
          alt="Theo Grace"
          height={40}
          style={{ display: "block", margin: "0 auto" }}
        />
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
