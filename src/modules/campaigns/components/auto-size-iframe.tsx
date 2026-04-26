"use client";

import { useCallback, useRef, useState } from "react";

// Self-resizing iframe for srcDoc-driven email previews. srcDoc creates a
// same-origin document, so we can read body.scrollHeight directly after
// load and grow (or scale-shrink) the iframe to fit its content.
//
// Two modes:
//
// - Full-size (default): the iframe expands to its content height. Use
//   for the expanded variant view, the completed-view's final preview,
//   and the standalone /preview route — surfaces where the operator
//   should see real-size pixels.
//
// - Scaled thumbnail (set `scale={n}`): the iframe stays at its natural
//   640px width but is visually shrunk via CSS transform. The wrapper is
//   sized to (640 * scale) wide × (contentHeight * scale) tall, so the
//   thumbnail card stays compact while still showing the *entire*
//   layout — operator clicks to expand for the real size. Use on the
//   3-up variant_selection cards.
//
// minHeight gives a sensible "still loading" placeholder so the page
// doesn't jump from 0 → contentHeight on each render.

interface AutoSizeIframeProps {
  srcDoc: string;
  title: string;
  /** When set (e.g. 0.5), renders the iframe at native 640px width and
   *  visually scales by this factor via CSS transform. */
  scale?: number;
  /** Pre-measure floor for the wrapper height (in scaled pixels). */
  minHeight?: number;
  /** Cap on the wrapper height (in scaled pixels). When the email is
   *  taller than this, the bottom is cropped — used on the variant
   *  cards so all 3 cards line up at the same height regardless of
   *  skeleton length. The full layout is still reachable via the
   *  expand-to-full-size view. */
  maxHeight?: number;
  className?: string;
  /** When true, sets pointer-events:none so a parent button can receive
   *  the click. Used on variant cards where the iframe is the click
   *  target conceptually but the parent <button> handles the click. */
  passThroughClicks?: boolean;
}

const NATIVE_WIDTH = 640;

export function AutoSizeIframe({
  srcDoc,
  title,
  scale,
  minHeight = 600,
  maxHeight,
  className,
  passThroughClicks = false,
}: AutoSizeIframeProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [contentHeight, setContentHeight] = useState(minHeight);

  const measure = useCallback(() => {
    const iframe = ref.current;
    if (!iframe?.contentWindow) return;
    try {
      const doc = iframe.contentWindow.document;
      const next = Math.max(
        minHeight,
        doc.documentElement.scrollHeight,
        doc.body.scrollHeight,
      );
      setContentHeight(next);
    } catch {
      // Cross-origin would throw; srcDoc never is, so ignore.
    }
  }, [minHeight]);

  if (scale && scale > 0 && scale < 1) {
    // Scaled-thumbnail mode: render the iframe at native 640px width inside
    // a smaller wrapper, transform-scale the iframe to fit. Wrapper height
    // = scaled content height (capped by maxHeight when supplied) so a
    // row of cards stays aligned regardless of per-skeleton length.
    const scaledHeight = contentHeight * scale;
    const wrapperHeight = maxHeight
      ? Math.min(scaledHeight, maxHeight)
      : scaledHeight;
    return (
      <div
        className={className}
        style={{
          width: `${NATIVE_WIDTH * scale}px`,
          height: `${wrapperHeight}px`,
          overflow: "hidden",
          pointerEvents: passThroughClicks ? "none" : undefined,
        }}
      >
        <iframe
          ref={ref}
          title={title}
          srcDoc={srcDoc}
          scrolling="no"
          onLoad={measure}
          style={{
            width: `${NATIVE_WIDTH}px`,
            height: `${contentHeight}px`,
            border: 0,
            overflow: "hidden",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    );
  }

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={srcDoc}
      scrolling="no"
      onLoad={measure}
      style={{
        height: `${contentHeight}px`,
        overflow: "hidden",
        pointerEvents: passThroughClicks ? "none" : undefined,
      }}
      className={className}
    />
  );
}
