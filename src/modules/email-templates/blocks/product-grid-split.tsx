// Alternating asymmetric 2-row layout.
// Row 1: narrow (33%) | wide (66%)
// Row 2: wide (66%) | narrow (33%)
// No gaps, no text — image-only. 4 products total.
//
// Fixed ROW_HEIGHT + objectFit:cover keeps both cells in each row the same
// height regardless of source image aspect ratio. objectFit is unsupported in
// Outlook desktop; Theo Grace's audience (Gmail / Apple Mail / mobile) handles
// it correctly.

import { Column, Img, Link, Row, Section } from "@react-email/components";
import { COLORS } from "./theme";
import type { ProductGridProps } from "./types";

const ROW_HEIGHT = 280;

function Cell({
  product,
  editable,
}: {
  product: ProductGridProps["products"][number];
  editable: boolean;
}) {
  return (
    <Link href={product.link} style={{ textDecoration: "none", display: "block" }}>
      <Img
        src={product.image_url}
        alt={product.title}
        width="640"
        data-edit-target={editable ? `image:product:${product.sku}` : undefined}
        style={{
          display: "block",
          width: "100%",
          height: `${ROW_HEIGHT}px`,
          objectFit: "cover",
          objectPosition: "center",
          border: "0",
          backgroundColor: COLORS.paleBlue,
        }}
      />
    </Link>
  );
}

export function ProductGridSplit({ products, editTargets }: ProductGridProps) {
  const [p0, p1, p2, p3] = products.slice(0, 4);
  const editable = Boolean(editTargets?.products);

  return (
    <Section style={{ backgroundColor: COLORS.white, padding: "0" }}>
      {p0 || p1 ? (
        <Row>
          {p0 && (
            <Column style={{ width: "33%", verticalAlign: "top", padding: "0" }}>
              <Cell product={p0} editable={editable} />
            </Column>
          )}
          {p1 && (
            <Column style={{ width: "67%", verticalAlign: "top", padding: "0" }}>
              <Cell product={p1} editable={editable} />
            </Column>
          )}
        </Row>
      ) : null}

      {p2 || p3 ? (
        <Row>
          {p2 && (
            <Column style={{ width: "67%", verticalAlign: "top", padding: "0" }}>
              <Cell product={p2} editable={editable} />
            </Column>
          )}
          {p3 && (
            <Column style={{ width: "33%", verticalAlign: "top", padding: "0" }}>
              <Cell product={p3} editable={editable} />
            </Column>
          )}
        </Row>
      ) : null}
    </Section>
  );
}
