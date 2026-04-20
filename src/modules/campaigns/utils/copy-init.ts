import type { ApprovedCopy, GeneratedCopy } from "@/lib/types";

// Seeds the ApprovedCopy editor state from the LLM output. Picks the first
// subject variant and deep-clones body blocks so the editor can mutate
// without touching generatedCopy.
export function initApprovedCopy(generated: GeneratedCopy): ApprovedCopy {
  if (generated.subject_variants.length === 0) {
    throw new Error(
      "GeneratedCopy has no subject_variants — cannot initialise approved copy.",
    );
  }

  return {
    campaign_id: generated.campaign_id,
    free_top_text: generated.free_top_text,
    body_blocks: generated.body_blocks.map((block) => ({ ...block })),
    subject_variant: { ...generated.subject_variants[0] },
    sms: generated.sms,
  };
}
