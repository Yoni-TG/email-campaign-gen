"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import type { ProductSnapshot } from "@/lib/types";

interface ProductGridProps {
  products: ProductSnapshot[];
  onChange: (products: ProductSnapshot[]) => void;
}

function SortableProductCard({
  product,
  onRemove,
}: {
  product: ProductSnapshot;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: product.sku });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const showSale = product.salePrice && product.salePrice !== product.price;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-lg border bg-white p-3"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="mt-1 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {product.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-16 w-16 rounded object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.sku}</p>
        <p className="mt-1 text-sm">
          {showSale ? (
            <>
              <span className="text-muted-foreground line-through">
                {product.currency} {product.price}
              </span>{" "}
              <span className="font-medium">
                {product.currency} {product.salePrice}
              </span>
            </>
          ) : (
            <span>
              {product.currency} {product.price}
            </span>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${product.name}`}
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProductGrid({ products, onChange }: ProductGridProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.sku === active.id);
      const newIndex = products.findIndex((p) => p.sku === over.id);
      onChange(arrayMove(products, oldIndex, newIndex));
    }
  };

  const handleRemove = (sku: string) => {
    onChange(products.filter((p) => p.sku !== sku));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={products.map((p) => p.sku)}
        strategy={rectSortingStrategy}
      >
        <ul className="space-y-2">
          {products.map((product) => (
            <li key={product.sku}>
              <SortableProductCard
                product={product}
                onRemove={() => handleRemove(product.sku)}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
