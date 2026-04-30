"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Campaign } from "@/lib/types";
import { EditPopover } from "./edit-popover";

// Click-to-edit shell wrapping the rendered email iframe. Listens for
// `theograce:edit` postMessages from the inline script in the rendered
// HTML, translates the iframe-local bounding rect to page coordinates,
// and renders a contextual popover near the clicked element. The popover
// reads / writes the campaign via the /fine-tune/* endpoints; on save we
// router.refresh() so the server re-fetches the campaign and the parent
// re-renders the editable HTML on the next tick.
//
// Auto-sizing: same trick as AutoSizeIframe — read body.scrollHeight on
// load (srcDoc is same-origin) so the iframe grows to its content,
// no internal scrollbar.

interface EditState {
  target: string;
  rect: { left: number; top: number; width: number; height: number };
}

interface Props {
  campaign: Campaign;
  /** Editable HTML rendered server-side with renderSkeleton(..., {editable:true}). */
  editableHtml: string;
}

export function EditableEmailFrame({ campaign, editableHtml }: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [contentHeight, setContentHeight] = useState(900);
  const [edit, setEdit] = useState<EditState | null>(null);

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
      const iframe = iframeRef.current;
      if (!iframe) return;
      const iframeRect = iframe.getBoundingClientRect();
      const r = data.rect as { x: number; y: number; w: number; h: number };
      setEdit({
        target: data.target as string,
        // Viewport-relative coords. Popover renders position:fixed so
        // it doesn't get reparented under our `relative` wrapper, which
        // would otherwise cause a double-offset (parent already sits
        // hundreds of pixels into the page, and absolute positioning
        // would add to that). The popover internally re-checks fit
        // against window.innerHeight/innerWidth.
        rect: {
          left: iframeRect.left + r.x,
          top: iframeRect.top + r.y,
          width: r.w,
          height: r.h,
        },
      });
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleSaved = () => {
    setEdit(null);
    router.refresh();
  };

  return (
    <div className="relative flex justify-center bg-surface-2 px-6 py-10">
      <iframe
        ref={iframeRef}
        title={`editable-${campaign.id}`}
        srcDoc={editableHtml}
        scrolling="no"
        onLoad={measure}
        style={{ height: `${contentHeight}px`, overflow: "hidden" }}
        className="block w-[640px] bg-white shadow-xl"
      />
      {edit ? (
        <EditPopover
          target={edit.target}
          rect={edit.rect}
          campaign={campaign}
          onClose={() => setEdit(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
