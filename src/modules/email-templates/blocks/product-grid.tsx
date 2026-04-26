// Shared grid renderer used by product_grid_2x2 and product_grid_3x2.
// Not exposed as a BlockType — the public blocks are the named arities.

import * as React from "react";
import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import type { BlueprintProduct } from "./types";

interface ProductGridInternalProps {
  products: BlueprintProduct[];
  columns: 2 | 3;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export function ProductGridInternal({ products, columns }: ProductGridInternalProps) {
  const maxRows = 2;
  const visible = products.slice(0, columns * maxRows);
  const rows = chunk(visible, columns);
  const cellWidthPct = 100 / columns;

  return (
    <Section style={{ backgroundColor: COLORS.white, padding: "24px 16px" }}>
      {rows.map((rowProducts, rowIdx) => (
        <Row key={rowIdx}>
          {rowProducts.map((product, colIdx) => (
            <Column
              key={`${rowIdx}-${colIdx}`}
              style={{ width: `${cellWidthPct}%`, padding: "8px", verticalAlign: "top" }}
            >
              <Link href={product.link} style={{ textDecoration: "none", color: COLORS.black }}>
                <Img
                  src={product.image_url}
                  alt={product.title}
                  width="280"
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "280px",
                    height: "auto",
                    margin: "0 auto 8px auto",
                    backgroundColor: COLORS.paleBlue,
                  }}
                />
                <Text
                  style={{
                    margin: "0 0 4px 0",
                    fontFamily: FONTS.body,
                    fontSize: "14px",
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
                    fontSize: "13px",
                    color: COLORS.black,
                    textAlign: "center",
                  }}
                >
                  {product.price}
                </Text>
              </Link>
            </Column>
          ))}
        </Row>
      ))}
    </Section>
  );
}
