// Renders a SkeletonManifest + RendererBlueprint to an HTML string suitable
// for email clients (and Klaviyo paste-in). Two phases:
//
// - withAssets:false  candidate preview — operator-uploaded assets resolve to
//                      neutral placeholders so the iframe preview shows
//                      structure without "missing image" markers.
// - withAssets:true   final render — assets resolve from blueprint.assets.
//                      Any key the manifest references but the blueprint
//                      doesn't supply is reported in `missingAssets` (still
//                      gets a placeholder so the HTML is well-formed).

import * as React from "react";
import { Body, Container, Font, Head, Html, Preview } from "@react-email/components";
import { render } from "@react-email/render";
import { COLORS } from "../blocks/theme";
import type { ComponentType } from "react";
import type {
  BindValue,
  ContentPath,
  RenderResult,
  SkeletonManifest,
} from "../types";
import { blockRegistry } from "./block-registry";
import type { RendererBlueprint } from "./types";

// Neutral light-grey placeholder for missing/pending assets so the operator
// reads structure without the placeholder competing with the brand palette.
const PLACEHOLDER_IMAGE_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'><rect width='640' height='360' fill='%23EEEEEE'/><text x='320' y='180' text-anchor='middle' font-family='Lato, sans-serif' font-size='14' fill='%23999999'>Asset placeholder</text></svg>";

interface ResolveResult {
  value: unknown;
  missingAsset: string | null;
}

function walkDottedPath(path: string, root: unknown): unknown {
  // Tokenise dotted paths with array indexing: "body_blocks[0].title"
  // → ["body_blocks", "[0]", "title"]
  const tokens = path.match(/[^.[\]]+|\[\d+\]/g) ?? [];
  let cur: unknown = root;
  for (const token of tokens) {
    if (cur == null) return undefined;
    if (token.startsWith("[")) {
      const idx = parseInt(token.slice(1, -1), 10);
      cur = (cur as unknown[])[idx];
    } else {
      cur = (cur as Record<string, unknown>)[token];
    }
  }
  return cur;
}

function resolveContentPath(
  path: ContentPath,
  blueprint: RendererBlueprint,
  withAssets: boolean,
): ResolveResult {
  if (path.startsWith("literal:")) {
    return { value: path.slice("literal:".length), missingAsset: null };
  }
  if (path.startsWith("assets.")) {
    const key = path.slice("assets.".length);
    if (!withAssets) {
      return { value: PLACEHOLDER_IMAGE_URL, missingAsset: null };
    }
    const url = blueprint.assets?.[key];
    if (!url) {
      return { value: PLACEHOLDER_IMAGE_URL, missingAsset: key };
    }
    return { value: url, missingAsset: null };
  }
  return { value: walkDottedPath(path, blueprint), missingAsset: null };
}

function resolveBindValue(
  value: BindValue,
  blueprint: RendererBlueprint,
  withAssets: boolean,
): ResolveResult {
  if (typeof value === "string") {
    return resolveContentPath(value, blueprint, withAssets);
  }
  return { value, missingAsset: null };
}

export async function renderSkeleton(
  manifest: SkeletonManifest,
  blueprint: RendererBlueprint,
  opts: { withAssets: boolean },
): Promise<RenderResult> {
  const missingAssets: string[] = [];

  const blockElements = manifest.blocks.map((entry, index) => {
    const Component = blockRegistry[entry.type] as ComponentType<
      Record<string, unknown>
    >;
    const props: Record<string, unknown> = {};
    for (const [propName, bindValue] of Object.entries(entry.bind)) {
      const { value, missingAsset } = resolveBindValue(
        bindValue,
        blueprint,
        opts.withAssets,
      );
      props[propName] = value;
      if (missingAsset && !missingAssets.includes(missingAsset)) {
        missingAssets.push(missingAsset);
      }
    }
    return <Component key={index} {...props} />;
  });

  // Email clients that honor web fonts (Apple Mail, iOS, Gmail with images
  // enabled) load Lato from Google Fonts — the rest fall back to Helvetica
  // via the stack in blocks/theme.ts. Big Caslon is proprietary; the
  // display fallback chain keeps to Georgia-class serifs, which clients
  // that can't load Big Caslon will use anyway.
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
      <Preview>{blueprint.subject_variant.preheader}</Preview>
      <Body style={{ backgroundColor: COLORS.white, margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            backgroundColor: COLORS.white,
          }}
        >
          {blockElements}
        </Container>
      </Body>
    </Html>
  );

  const html = await render(tree, { pretty: false });

  return { html, missingAssets };
}
