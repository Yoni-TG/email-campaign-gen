"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Campaign } from "@/lib/types";
import type { AutoSaveStatus } from "@/lib/use-auto-save";
import type { SkeletonManifest } from "@/modules/email-templates/types";
import { targetToBlockIndex } from "@/modules/campaigns/utils/block-properties";
import { LayersPanel } from "./layers-panel";
import { DesignCanvas, type CanvasRect } from "./design-canvas";
import { PropertiesPanel, type Selection } from "./properties-panel";
import { DesignActionBar } from "./design-action-bar";

interface Props {
  campaign: Campaign;
  skeleton: SkeletonManifest;
  editableHtml: string;
}

export function DesignStepView({ campaign, skeleton, editableHtml }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Selection | null>(null);
  const [savingState, setSavingState] = useState<AutoSaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const lastHtmlRef = useRef(editableHtml);

  // The iframe re-mounts when editableHtml changes (after a save). The
  // rect we captured at click time is stale at that point — clear it
  // (keep the index/sku so the panel selection persists) until the
  // next click.
  useEffect(() => {
    if (lastHtmlRef.current !== editableHtml) {
      lastHtmlRef.current = editableHtml;
      setSelected((prev) => {
        if (!prev) return null;
        if (prev.kind === "block") {
          return { ...prev, rect: null, target: null };
        }
        return { ...prev, rect: null };
      });
    }
  }, [editableHtml]);

  const handleCanvasSelect = useCallback(
    (target: string, rect: CanvasRect) => {
      if (target.startsWith("image:product:")) {
        const sku = target.slice("image:product:".length);
        setSelected({ kind: "product", sku, target, rect });
        return;
      }
      const idx = targetToBlockIndex(skeleton, target);
      if (idx === null) return;
      setSelected({ kind: "block", index: idx, target, rect });
    },
    [skeleton],
  );

  const handleLayerSelect = useCallback((index: number) => {
    setSelected({ kind: "block", index, target: null, rect: null });
  }, []);

  const handleSaving = useCallback(() => {
    setSavingState("saving");
  }, []);

  const handleSaved = useCallback(() => {
    setSavingState("saved");
    setSavedAt(new Date());
    router.refresh();
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-1">
        <LayersPanel
          skeleton={skeleton}
          selectedIndex={selected?.kind === "block" ? selected.index : null}
          onSelect={handleLayerSelect}
        />
        <DesignCanvas
          campaignId={campaign.id}
          editableHtml={editableHtml}
          selectedRect={selected?.rect ?? null}
          onBlockSelect={handleCanvasSelect}
        />
        <PropertiesPanel
          campaign={campaign}
          skeleton={skeleton}
          selection={selected}
          onSaving={handleSaving}
          onSaved={handleSaved}
        />
      </div>
      <DesignActionBar
        campaignId={campaign.id}
        skeletonId={skeleton.id}
        savingState={savingState}
        savedAt={savedAt}
        html={campaign.renderResult?.html ?? ""}
      />
    </div>
  );
}
