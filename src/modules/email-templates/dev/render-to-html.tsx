// Wraps a single block JSX in a minimal Html/Body/Container tree and renders
// to an HTML string — the same shell render-skeleton uses, so iframes look
// like a real email-client paint of the block in isolation. Includes the
// Lato @font-face declaration so the in-app /blocks catalog renders with
// the brand body font (display falls back to Georgia per blocks/theme.ts).

import * as React from "react";
import { Body, Container, Font, Head, Html } from "@react-email/components";
import { render } from "@react-email/render";
import { COLORS } from "../blocks/theme";

export async function renderBlockToHtml(
  block: React.ReactElement,
): Promise<string> {
  const tree = (
    <Html>
      <Head>
        <Font
          fontFamily="Lato"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjxAwXjeu.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Lato"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.woff2",
            format: "woff2",
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Body style={{ backgroundColor: COLORS.white, margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            backgroundColor: COLORS.white,
          }}
        >
          {block}
        </Container>
      </Body>
    </Html>
  );
  return render(tree, { pretty: false });
}
