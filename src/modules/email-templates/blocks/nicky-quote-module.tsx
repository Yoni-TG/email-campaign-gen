import { Column, Img, Row, Section, Text } from "@react-email/components";
import { COLORS, FONTS, bgColor } from "./theme";
import type { NickyQuoteModuleProps } from "./types";

export function NickyQuoteModule({
  quote,
  response,
  portraitUrl,
  background = "pale_blue",
  editTargets,
}: NickyQuoteModuleProps) {
  const quoteContent = (
    <>
      <Text
        data-edit-target={editTargets?.quote}
        style={{
          margin: "0 0 12px 0",
          fontFamily: FONTS.display,
          fontStyle: "italic",
          fontSize: "20px",
          color: COLORS.black,
          lineHeight: 1.4,
        }}
      >
        &ldquo;{quote}&rdquo;
      </Text>
      <Text
        style={{
          margin: "0 0 8px 0",
          fontFamily: FONTS.body,
          fontSize: "13px",
          color: COLORS.black,
          letterSpacing: "0.1em",
        }}
      >
        — Nicky Hilton
      </Text>
      {response ? (
        <Text
          data-edit-target={editTargets?.response}
          style={{
            margin: "8px 0 0 0",
            fontFamily: FONTS.body,
            fontSize: "13px",
            color: COLORS.black,
            fontStyle: "italic",
          }}
        >
          {response}
        </Text>
      ) : null}
    </>
  );

  return (
    <Section
      data-edit-target={editTargets?.background}
      style={{ backgroundColor: bgColor(background), padding: "32px 24px" }}
    >
      {portraitUrl ? (
        <Row>
          <Column style={{ width: "30%", verticalAlign: "middle" }}>
            <Img
              src={portraitUrl}
              alt="Nicky Hilton"
              width="120"
              data-edit-target={editTargets?.portraitUrl}
              style={{
                display: "block",
                width: "100%",
                maxWidth: "120px",
                height: "auto",
                borderRadius: "999px",
                margin: "0 auto",
              }}
            />
          </Column>
          <Column style={{ width: "70%", verticalAlign: "middle", paddingLeft: "16px" }}>
            {quoteContent}
          </Column>
        </Row>
      ) : (
        <Section style={{ maxWidth: "520px", margin: "0 auto", textAlign: "center" }}>
          {quoteContent}
        </Section>
      )}
    </Section>
  );
}
