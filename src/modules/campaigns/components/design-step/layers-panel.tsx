"use client";

import { useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { SkeletonManifest } from "@/modules/email-templates/types";
import { BLOCK_TYPE_LABELS } from "@/modules/campaigns/utils/block-properties";

interface Props {
  campaignId: string;
  skeleton: SkeletonManifest;
  /** Operator-supplied display order. Null = manifest natural order. */
  blockOrder: number[] | null;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onSaving?: () => void;
  onSaved: () => void;
}

// Left rail of the design editor. Lists blocks in the campaign's
// current display order (server-supplied via blockOrder, falling back
// to the manifest's natural order). Drag-and-drop persists a new order
// via /fine-tune/block-order — the server re-renders and router.refresh
// from onSaved cycles the iframe.
export function LayersPanel({
  campaignId,
  skeleton,
  blockOrder,
  selectedIndex,
  onSelect,
  onSaving,
  onSaved,
}: Props) {
  // Local-display order so the row positions update before the server
  // round-trip lands. Falls back to the manifest order when no override.
  const [order, setOrder] = useState<number[]>(
    () => blockOrder ?? skeleton.blocks.map((_, i) => i),
  );
  // Re-sync when the server pushes a new order in (e.g. concurrent edit
  // or initial load after refresh).
  useMemo(() => {
    const next = blockOrder ?? skeleton.blocks.map((_, i) => i);
    // Only replace state if it actually differs — preserves drag inertia.
    if (next.length !== order.length || next.some((v, i) => v !== order[i])) {
      setOrder(next);
    }
    // Tracking by skeleton id + serialized blockOrder is enough; the
    // setter is React-stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skeleton.id, JSON.stringify(blockOrder)]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = order.map((i) => `layer-${i}`);

  const persist = async (next: number[]) => {
    onSaving?.();
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/fine-tune/block-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockOrder: next }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Reorder failed");
      }
      toast.success("Order updated — re-rendered.");
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reorder failed";
      toast.error(message);
      // Roll back to the server's truth on failure.
      setOrder(blockOrder ?? skeleton.blocks.map((_, i) => i));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    const next = arrayMove(order, from, to);
    setOrder(next);
    void persist(next);
  };

  return (
    <aside className="w-[180px] shrink-0 border-r border-border bg-surface px-3 py-4">
      <h2 className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        Sections
      </h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1">
            {order.map((manifestIndex) => {
              const block = skeleton.blocks[manifestIndex];
              if (!block) return null;
              return (
                <SortableLayerRow
                  key={`layer-${manifestIndex}`}
                  id={`layer-${manifestIndex}`}
                  active={selectedIndex === manifestIndex}
                  label={BLOCK_TYPE_LABELS[block.type]}
                  onSelect={() => onSelect(manifestIndex)}
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={() => toast.info("Adding sections is coming soon.")}
        className="mt-3 px-2 text-xs font-medium text-brand hover:underline"
      >
        + Add section
      </button>
    </aside>
  );
}

function SortableLayerRow({
  id,
  active,
  label,
  onSelect,
}: {
  id: string;
  active: boolean;
  label: string;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = { transform: CSS.Translate.toString(transform), transition };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "z-10 opacity-80")}
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-md transition-colors",
          active ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2",
        )}
      >
        <button
          type="button"
          aria-label="Drag to reorder"
          className="cursor-grab touch-none p-1.5 text-ink-4 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          aria-pressed={active}
          onClick={onSelect}
          className={cn(
            "grow truncate py-1.5 pr-2 text-left text-sm",
            active && "font-semibold",
          )}
        >
          {label}
        </button>
      </div>
    </li>
  );
}
