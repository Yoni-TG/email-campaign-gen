// Shared grid renderer used by product_grid_2x2, _3x2, _4x1.
// Not exposed as a BlockType — the public blocks are the named arities.

import * as React from "react";
import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import type { BlueprintProduct } from "./types";

interface ProductGridInternalProps {
  products: BlueprintProduct[];
  columns: 2 | 3 | 4;
  rows: 1 | 2;
  /** When true, hide the product name and price under each cell — used by
   *  asymmetric / magazine-style layouts where the cells are visual only. */
  imageOnly?: boolean;
  /** Set when the grid is rendered in editable mode — each product image
   *  gets a per-sku data-edit-target so the click-to-edit popover knows
   *  which approvedProducts row to update. */
  editable?: boolean;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export function ProductGridInternal({
  products,
  columns,
  rows: rowCount,
  imageOnly = false,
  editable = false,
}: ProductGridInternalProps) {
  const visible = products.slice(0, columns * rowCount);
  const rows = chunk(visible, columns);
  const cellWidthPct = 100 / columns;
  const labelFontSize = columns >= 4 ? "12px" : "13px";

  return (
    <Section style={{ backgroundColor: COLORS.white, padding: "16px 12px" }}>
      {rows.map((rowProducts, rowIdx) => (
        <Row key={rowIdx}>
          {rowProducts.map((product, colIdx) => (
            <Column
              key={`${rowIdx}-${colIdx}`}
              style={{ width: `${cellWidthPct}%`, padding: "4px", verticalAlign: "top" }}
            >
              <Link href={product.link} style={{ textDecoration: "none", color: COLORS.black }}>
                <Img
                  src={product.image_url}
                  alt={product.title}
                  width="280"
                  data-edit-target={
                    editable ? `image:product:${product.sku}` : undefined
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "280px",
                    height: "auto",
                    margin: "0 auto 6px auto",
                    backgroundColor: COLORS.paleBlue,
                  }}
                />
                {imageOnly ? null : (
                  <>
                    <Text
                      style={{
                        margin: "0 0 2px 0",
                        fontFamily: FONTS.body,
                        fontSize: labelFontSize,
                        color: COLORS.black,
                        textAlign: "center",
                      }}
                    >
                      {product.title}
                    </Text>
                    <Text
                      style={{
                        margin: 0,
                        fontFamily: FONTS.body,
                        fontSize: labelFontSize,
                        color: COLORS.black,
                        textAlign: "center",
                      }}
                    >
                      {product.price}
                    </Text>
                  </>
                )}
              </Link>
            </Column>
          ))}
        </Row>
      ))}
    </Section>
  );
}
