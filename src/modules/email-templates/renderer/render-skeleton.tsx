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
//
// editable mode (off by default) layers click-to-edit hooks on top of the
// regular render. Each block gets `editTargets` derived from its bind
// paths, the rendered DOM tags editable elements with data-edit-target,
// and a small inline script postMessages clicks back to the parent
// window. The completed-view embeds this editable HTML inside an
// EditableEmailFrame; the final HTML stored on the campaign always uses
// editable: false.

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

// Maps a bind path (the resolver-side identifier of where a value comes
// from) to a click-to-edit data attribute that survives into the rendered
// HTML. The popover layer uses this string to pick the right edit
// surface (file picker for images, text input for copy) and to derive
// the API call. `null` = this prop isn't user-editable (literal:, or the
// products array — grids emit per-cell targets themselves).
function pathToEditTarget(path: string): string | null {
  if (path.startsWith("literal:")) return null;
  if (path.startsWith("assets.")) {
    return `image:asset:${path.slice("assets.".length)}`;
  }
  if (path === "products") return "products";
  if (
    /^body_blocks\[\d+\]\.(title|description|cta)$/.test(path) ||
    path === "subject_variant.subject" ||
    path === "subject_variant.preheader" ||
    path === "free_top_text" ||
    path === "nicky_quote.quote" ||
    path === "nicky_quote.response" ||
    path === "sms"
  ) {
    return `text:${path}`;
  }
  return null;
}

function computeEditTargets(
  bind: Record<string, BindValue>,
): Record<string, string> {
  const targets: Record<string, string> = {};
  for (const [propName, value] of Object.entries(bind)) {
    if (typeof value !== "string") continue;
    const target = pathToEditTarget(value);
    if (target) targets[propName] = target;
  }
  return targets;
}

// Click-listener injected into the rendered HTML when editable: true.
// Captures clicks early (capture phase) so anchor / button defaults
// don't fire, then posts the editable element's id + rect to the parent
// window so the popover layer can position itself over it.
const EDIT_CLICK_SCRIPT = `
(function() {
  document.addEventListener('click', function(e) {
    var t = e.target.closest('[data-edit-target]');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    var r = t.getBoundingClientRect();
    window.parent.postMessage({
      type: 'theograce:edit',
      target: t.getAttribute('data-edit-target'),
      rect: { x: r.left, y: r.top, w: r.width, h: r.height }
    }, '*');
  }, true);
})();
`;

// Hover outline visible on every editable element — text, image, and
// section bg. Outline-offset of 2px keeps the line from clipping the
// element; box-shadow adds an inner glow so dark images don't lose the
// affordance against the page background. The 'cursor: pointer'
// override is !important because anchor and button defaults would
// otherwise win.
const EDIT_HIGHLIGHT_CSS = `
[data-edit-target] {
  cursor: pointer !important;
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: outline-color 120ms, box-shadow 120ms;
}
[data-edit-target]:hover {
  outline: 3px solid #76A4C4;
  box-shadow: 0 0 0 1px rgba(118, 164, 196, 0.25);
}
`;

export async function renderSkeleton(
  manifest: SkeletonManifest,
  blueprint: RendererBlueprint,
  opts: {
    withAssets: boolean;
    editable?: boolean;
    /**
     * Per-block prop overrides applied on top of bind-resolved values.
     * Keyed by block index. Used by the fine-tune flow to swap a
     * block's background colour at render time without touching the
     * skeleton manifest.
     */
    blockOverrides?: Record<number, Record<string, unknown>> | null;
  },
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
    // Apply per-block overrides (e.g. background) AFTER the bind
    // resolution so the override wins. Useful when the manifest didn't
    // bind a prop at all — operators can still set it via fine-tune.
    const override = opts.blockOverrides?.[index];
    if (override) Object.assign(props, override);
    if (opts.editable) {
      // Bind-derived edit targets for inner elements (image / text).
      const editTargets = computeEditTargets(entry.bind);
      // Always allow background editing on editable renders — even when
      // the manifest doesn't bind `background`, the operator can pick a
      // colour at fine-tune time. Block components apply this attribute
      // to whichever Section paints their background.
      editTargets.background = `bg:block:${index}`;
      props.editTargets = editTargets;
    }
    return <Component key={index} {...props} />;
  });

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
        {opts.editable ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: EDIT_HIGHLIGHT_CSS }} />
            <script dangerouslySetInnerHTML={{ __html: EDIT_CLICK_SCRIPT }} />
          </>
        ) : null}
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
