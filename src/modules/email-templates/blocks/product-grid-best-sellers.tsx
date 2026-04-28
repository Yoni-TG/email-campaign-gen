// Alternating best-sellers table.
// Each product occupies a full row: image on one side, copy on the other.
// Odd rows → image left | text right. Even rows → text left | image right.
// The `price` field carries the deal label (e.g. "25% off").

import * as React from "react";
import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { COLORS, FONTS } from "./theme";
import type { ProductGridProps } from "./types";

export function ProductGridBestSellers({ products, editTargets }: ProductGridProps) {
  const editable = Boolean(editTargets?.products);

  return (
    <Section style={{ backgroundColor: COLORS.white, padding: "0" }}>
      {products.slice(0, 6).map((product, i) => {
        const imageLeft = i % 2 === 0;

        const imageCol = (
          <Column style={{ width: "50%", verticalAlign: "top", padding: "0" }}>
            <Link href={product.link} style={{ textDecoration: "none", display: "block" }}>
              <Img
                src={product.image_url}
                alt={product.title}
                width="320"
                data-edit-target={editable ? `image:product:${product.sku}` : undefined}
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  backgroundColor: COLORS.paleBlue,
                }}
              />
            </Link>
          </Column>
        );

        const textCol = (
          <Column
            style={{
              width: "50%",
              verticalAlign: "middle",
              padding: "20px 16px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                margin: "0 0 10px 0",
                fontFamily: FONTS.body,
                fontSize: "14px",
                lineHeight: "1.5",
                color: COLORS.black,
                textAlign: "center",
              }}
            >
              {product.title}
            </Text>
            <Text
              style={{
                margin: "0 0 14px 0",
                fontFamily: FONTS.display,
                fontSize: "26px",
                fontWeight: "bold",
                color: COLORS.black,
                textAlign: "center",
                letterSpacing: "-0.3px",
              }}
            >
              ✦ {product.price} ✦
            </Text>
            <Link
              href={product.link}
              style={{
                fontFamily: FONTS.body,
                fontSize: "12px",
                color: COLORS.black,
                textDecoration: "underline",
                textUnderlineOffset: "2px",
              }}
            >
              Shop Now
            </Link>
          </Column>
        );

        return (
          <Row key={i}>
            {imageLeft ? imageCol : textCol}
            {imageLeft ? textCol : imageCol}
          </Row>
        );
      })}
    </Section>
  );
}
