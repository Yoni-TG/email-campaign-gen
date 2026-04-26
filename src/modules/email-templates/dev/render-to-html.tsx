// Wraps a single block JSX in a minimal Html/Body/Container tree and renders
// to an HTML string — the same shell render-skeleton uses, so iframes look
// like a real email-client paint of the block in isolation.

import * as React from "react";
import { Body, Container, Head, Html } from "@react-email/components";
import { render } from "@react-email/render";
import { COLORS } from "../blocks/theme";

export async function renderBlockToHtml(
  block: React.ReactElement,
): Promise<string> {
  const tree = (
    <Html>
      <Head />
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
