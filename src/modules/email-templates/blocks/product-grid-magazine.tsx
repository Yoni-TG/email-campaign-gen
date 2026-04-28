// Magazine / asymmetric grid — 1 large cell paired with 2 stacked smaller
// cells, alternating sides per row. Inspired by the Theo Grace wireframes
// where editorial campaigns use varied cell sizes to break grid rhythm.
//
// Renders up to 6 products (2 rows × 3 cells). Cell content is image-only;
// the visual mass of the imagery does the talking, so titles + prices live
// outside this block (typically in a closing_block or section_label below).

import * as React from "react";
import { Column, Img, Link, Row, Section } from "@react-email/components";
import { COLORS } from "./theme";
import type { ProductGridProps } from "./types";

const BIG_HEIGHT = 280;
const SMALL_HEIGHT = 134;
const GAP = 4;

function ImageCell({
  product,
  height,
  editable,
}: {
  product: ProductGridProps["products"][number];
  height: number;
  editable: boolean;
}) {
  return (
    <Link
      href={product.link}
      style={{ textDecoration: "none", color: COLORS.black }}
    >
      <Img
        src={product.image_url}
        alt={product.title}
        width="640"
        data-edit-target={editable ? `image:product:${product.sku}` : undefined}
        style={{
          display: "block",
          width: "100%",
          height: `${height}px`,
          objectFit: "cover",
          backgroundColor: COLORS.paleBlue,
          borderRadius: "2px",
        }}
      />
    </Link>
  );
}

export function ProductGridMagazine({ products, editTargets }: ProductGridProps) {
  const visible = products.slice(0, 6);
  const rowA = visible.slice(0, 3); // big-left, two-stacked-right
  const rowB = visible.slice(3, 6); // two-stacked-left, big-right
  const editable = Boolean(editTargets?.products);

  const stackedColumn = (
    items: ProductGridProps["products"],
    side: "left" | "right",
  ) => (
    <Column
      style={{
        width: "33%",
        verticalAlign: "top",
        paddingLeft: side === "right" ? `${GAP}px` : 0,
        paddingRight: side === "left" ? `${GAP}px` : 0,
      }}
    >
      {items[0] ? (
        <ImageCell product={items[0]} height={SMALL_HEIGHT} editable={editable} />
      ) : null}
      <div style={{ height: `${GAP}px` }} />
      {items[1] ? (
        <ImageCell product={items[1]} height={SMALL_HEIGHT} editable={editable} />
      ) : null}
    </Column>
  );

  const bigColumn = (
    item: ProductGridProps["products"][number] | undefined,
    side: "left" | "right",
  ) => (
    <Column
      style={{
        width: "67%",
        verticalAlign: "top",
        paddingLeft: side === "right" ? `${GAP}px` : 0,
        paddingRight: side === "left" ? `${GAP}px` : 0,
      }}
    >
      {item ? <ImageCell product={item} height={BIG_HEIGHT} editable={editable} /> : null}
    </Column>
  );

  return (
    <Section style={{ backgroundColor: COLORS.white, padding: "16px 12px" }}>
      {rowA.length > 0 ? (
        <Row>
          {bigColumn(rowA[0], "left")}
          {stackedColumn([rowA[1], rowA[2]].filter(Boolean) as typeof rowA, "right")}
        </Row>
      ) : null}
      {rowA.length > 0 && rowB.length > 0 ? (
        <div style={{ height: `${GAP}px` }} />
      ) : null}
      {rowB.length > 0 ? (
        <Row>
          {stackedColumn([rowB[0], rowB[1]].filter(Boolean) as typeof rowB, "left")}
          {bigColumn(rowB[2], "right")}
        </Row>
      ) : null}
    </Section>
  );
}
