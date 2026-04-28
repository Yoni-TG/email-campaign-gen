// 2×2 image-only product grid.
// Each cell is ~296px wide (half of 600px email minus 4px total gap).
// Portrait images (roughly 325×415 source) render at full cell width,
// height auto — preserving aspect ratio without email-client objectFit hacks.

import { Column, Img, Link, Row, Section } from "@react-email/components";
import { COLORS } from "./theme";
import type { ProductGridProps } from "./types";

const GAP = 4; // px between cells (horizontal and vertical)

export function ProductGrid2x2({ products, editTargets }: ProductGridProps) {
  const visible = products.slice(0, 4);
  const rowA = visible.slice(0, 2);
  const rowB = visible.slice(2, 4);
  const editable = Boolean(editTargets?.products);

  return (
    <Section style={{ backgroundColor: COLORS.white, padding: "0" }}>
      {rowA.length > 0 && (
        <Row style={{ marginBottom: `${GAP}px` }}>
          {rowA.map((product, i) => (
            <Column key={i} style={{ width: "50%", padding: `0 ${GAP / 2}px` }}>
              <Link href={product.link} style={{ textDecoration: "none" }}>
                <Img
                  src={product.image_url}
                  alt={product.title}
                  width="296"
                  data-edit-target={
                    editable ? `image:product:${product.sku}` : undefined
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    backgroundColor: COLORS.paleBlue,
                  }}
                />
              </Link>
            </Column>
          ))}
        </Row>
      )}
      {rowB.length > 0 && (
        <Row>
          {rowB.map((product, i) => (
            <Column key={i} style={{ width: "50%", padding: `0 ${GAP / 2}px` }}>
              <Link href={product.link} style={{ textDecoration: "none" }}>
                <Img
                  src={product.image_url}
                  alt={product.title}
                  width="296"
                  data-edit-target={
                    editable ? `image:product:${product.sku}` : undefined
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    backgroundColor: COLORS.paleBlue,
                  }}
                />
              </Link>
            </Column>
          ))}
        </Row>
      )}
    </Section>
  );
}
