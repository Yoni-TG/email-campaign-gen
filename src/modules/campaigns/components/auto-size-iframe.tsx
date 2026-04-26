"use client";

import { useCallback, useRef, useState } from "react";

// Self-resizing iframe for srcDoc-driven email previews. srcDoc creates a
// same-origin document, so we can read body.scrollHeight directly after
// load and grow the iframe to fit its content. Without this, every iframe
// either has an arbitrary fixed height (cuts off tall skeletons) or
// scrolls internally (hides content from the operator).
//
// minHeight gives a sensible "still loading" placeholder so the page
// doesn't jump from 0 → 2000px on each render. Pass `minHeight` per
// surface (cards 600, expanded 900, etc.) — the iframe will only grow,
// never shrink below it.

interface AutoSizeIframeProps {
  srcDoc: string;
  title: string;
  minHeight?: number;
  className?: string;
  /** When true, sets pointer-events:none so a parent button can receive
   *  the click. Used on variant cards where the iframe is the click
   *  target conceptually but the parent <button> handles the click. */
  passThroughClicks?: boolean;
}

export function AutoSizeIframe({
  srcDoc,
  title,
  minHeight = 600,
  className,
  passThroughClicks = false,
}: AutoSizeIframeProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);

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
      setHeight(next);
    } catch {
      // Cross-origin would throw; srcDoc never is, so ignore.
    }
  }, [minHeight]);

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={srcDoc}
      onLoad={measure}
      style={{
        height: `${height}px`,
        pointerEvents: passThroughClicks ? "none" : undefined,
      }}
      className={className}
    />
  );
}
