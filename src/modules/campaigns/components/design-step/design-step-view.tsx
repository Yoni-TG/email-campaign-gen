"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Campaign } from "@/lib/types";
import type { SkeletonManifest } from "@/modules/email-templates/types";
import { targetToBlockIndex } from "@/modules/campaigns/utils/block-properties";
import { LayersPanel } from "./layers-panel";
import { DesignCanvas, type CanvasRect } from "./design-canvas";
import { PropertiesPanel } from "./properties-panel";
import { DesignActionBar, type SavingState } from "./design-action-bar";

interface SelectedBlock {
  index: number;
  target: string | null;
  rect: CanvasRect | null;
}

interface Props {
  campaign: Campaign;
  skeleton: SkeletonManifest;
  editableHtml: string;
}

export function DesignStepView({ campaign, skeleton, editableHtml }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<SelectedBlock | null>(null);
  const [savingState, setSavingState] = useState<SavingState>("saved");
  const lastHtmlRef = useRef(editableHtml);

  // The iframe re-mounts when editableHtml changes (after a save). The
  // rect we captured at click time is stale at that point — clear it
  // (keep the index so the layers/properties panel selection persists)
  // until the next click.
  useEffect(() => {
    if (lastHtmlRef.current !== editableHtml) {
      lastHtmlRef.current = editableHtml;
      setSelected((prev) =>
        prev ? { ...prev, rect: null, target: null } : null,
      );
    }
  }, [editableHtml]);

  const handleCanvasSelect = useCallback(
    (target: string, rect: CanvasRect) => {
      const idx = targetToBlockIndex(skeleton, target);
      if (idx === null) return;
      setSelected({ index: idx, target, rect });
    },
    [skeleton],
  );

  const handleLayerSelect = useCallback((index: number) => {
    setSelected({ index, target: null, rect: null });
  }, []);

  const handleSaving = useCallback(() => {
    setSavingState("saving");
  }, []);

  const handleSaved = useCallback(() => {
    setSavingState("saved");
    router.refresh();
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-1">
        <LayersPanel
          skeleton={skeleton}
          selectedIndex={selected?.index ?? null}
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
          selectedIndex={selected?.index ?? null}
          onSaving={handleSaving}
          onSaved={handleSaved}
        />
      </div>
      <DesignActionBar
        campaignId={campaign.id}
        skeletonId={skeleton.id}
        savingState={savingState}
      />
    </div>
  );
}
