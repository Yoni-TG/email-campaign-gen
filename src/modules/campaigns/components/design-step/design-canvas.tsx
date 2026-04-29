"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface CanvasRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  campaignId: string;
  editableHtml: string;
  selectedRect: CanvasRect | null;
  onBlockSelect: (target: string, rect: CanvasRect) => void;
}

// Center column of the design editor. Renders the editable email
// inside an auto-sized iframe (same srcDoc trick EditableEmailFrame
// uses) and overlays a 2px brand-coloured selection outline at the
// last-clicked rect. The iframe sends `theograce:edit` postMessages
// from the renderer's existing inline script — we listen, decode, and
// hand the click off to the parent state owner.
export function DesignCanvas({
  campaignId,
  editableHtml,
  selectedRect,
  onBlockSelect,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [contentHeight, setContentHeight] = useState(900);

  const measure = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    try {
      const doc = iframe.contentWindow.document;
      setContentHeight(
        Math.max(900, doc.documentElement.scrollHeight, doc.body.scrollHeight),
      );
    } catch {
      // srcDoc is same-origin — won't happen in practice.
    }
  }, []);

  useEffect(() => {
    function handler(e: MessageEvent) {
      const data = e.data;
      if (!data || data.type !== "theograce:edit") return;
      const r = data.rect as CanvasRect | undefined;
      if (!r) return;
      onBlockSelect(data.target as string, r);
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onBlockSelect]);

  return (
    <div className="flex flex-1 justify-center overflow-y-auto bg-surface-2 px-6 py-10">
      <div className="relative shadow-xl">
        <iframe
          ref={iframeRef}
          title={`design-${campaignId}`}
          srcDoc={editableHtml}
          scrolling="no"
          onLoad={measure}
          style={{ height: `${contentHeight}px` }}
          className="block w-[640px] bg-white"
        />
        {selectedRect ? (
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: `${selectedRect.x}px`,
              top: `${selectedRect.y}px`,
              width: `${selectedRect.w}px`,
              height: `${selectedRect.h}px`,
              outline: "2px solid var(--brand)",
              outlineOffset: "2px",
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
