import Link from "next/link";
import {
  LEAD_PERSONALITY_LABELS,
  LEAD_VALUE_LABELS,
} from "@/lib/types";
import type { CreativeSeed } from "@/lib/types";

interface Props {
  seed: CreativeSeed;
  /** Where the "Edit brief" link points — step 1 in edit mode. */
  editHref: string;
}

// Sticky read-only summary of the campaign brief, shown next to the copy
// editor. Mirrors the brief's voice/categories chip styling so the
// operator can sanity-check tone/scope without flipping back to step 1.
export function BriefRail({ seed, editHref }: Props) {
  const voiceChips = [
    LEAD_VALUE_LABELS[seed.leadValue],
    ...seed.leadPersonalities.map((p) => LEAD_PERSONALITY_LABELS[p]),
  ];

  return (
    <aside className="sticky top-16 self-start bg-surface-2 px-6 py-8">
      <RailLabel>Brief</RailLabel>
      <p className="mt-2 text-sm leading-6 text-ink-2">
        {seed.mainMessage}
      </p>
      {seed.secondaryMessage && (
        <p className="mt-2 text-sm leading-6 text-ink-3">
          {seed.secondaryMessage}
        </p>
      )}

      {voiceChips.length > 0 && (
        <div className="mt-6">
          <RailLabel>Voice</RailLabel>
          <ChipGroup chips={voiceChips} variant="brand" />
        </div>
      )}

      {seed.targetCategories.length > 0 && (
        <div className="mt-6">
          <RailLabel>Categories</RailLabel>
          <ChipGroup chips={seed.targetCategories} variant="muted" />
        </div>
      )}

      <Link
        href={editHref}
        className="mt-8 inline-block text-xs font-medium text-ink-3 underline-offset-4 hover:text-ink hover:underline"
      >
        Edit brief
      </Link>
    </aside>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
      {children}
    </p>
  );
}

function ChipGroup({
  chips,
  variant,
}: {
  chips: string[];
  variant: "brand" | "muted";
}) {
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li
          key={chip}
          className={
            variant === "brand"
              ? "rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand"
              : "rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink-2"
          }
        >
          {chip}
        </li>
      ))}
    </ul>
  );
}
