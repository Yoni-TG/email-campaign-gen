import type { ApprovedCopy } from "@/lib/types";

// approvedCopy paths follow the same dotted/array language as the
// renderer's bind paths: subject_variant.subject, body_blocks[0].title,
// nicky_quote.quote, etc. These helpers walk the JSON shape and produce
// a new copy with one field patched.

export type Path =
  | "subject_variant.subject"
  | "subject_variant.preheader"
  | "free_top_text"
  | "sms"
  | "nicky_quote.quote"
  | "nicky_quote.response"
  | string;

export function readPath(copy: ApprovedCopy | null, path: Path): string | null {
  if (!copy) return null;
  if (path === "subject_variant.subject") return copy.subject_variant.subject;
  if (path === "subject_variant.preheader") return copy.subject_variant.preheader;
  if (path === "free_top_text") return copy.free_top_text;
  if (path === "sms") return copy.sms;
  if (path === "nicky_quote.quote") return copy.nicky_quote?.quote ?? null;
  if (path === "nicky_quote.response") return copy.nicky_quote?.response ?? null;
  const m = path.match(/^body_blocks\[(\d+)\]\.(title|description|cta|cta_href)$/);
  if (m) {
    const i = parseInt(m[1], 10);
    const field = m[2] as "title" | "description" | "cta" | "cta_href";
    return copy.body_blocks[i]?.[field] ?? null;
  }
  return null;
}

export function writePath(
  copy: ApprovedCopy,
  path: Path,
  value: string | null,
): ApprovedCopy {
  const v = value ?? null;
  if (path === "subject_variant.subject") {
    return {
      ...copy,
      subject_variant: { ...copy.subject_variant, subject: v ?? "" },
    };
  }
  if (path === "subject_variant.preheader") {
    return {
      ...copy,
      subject_variant: { ...copy.subject_variant, preheader: v ?? "" },
    };
  }
  if (path === "free_top_text") return { ...copy, free_top_text: v };
  if (path === "sms") return { ...copy, sms: v };
  if (path === "nicky_quote.quote") {
    if (!v) return { ...copy, nicky_quote: null };
    return {
      ...copy,
      nicky_quote: { quote: v, response: copy.nicky_quote?.response ?? null },
    };
  }
  if (path === "nicky_quote.response") {
    if (!copy.nicky_quote) return copy;
    return {
      ...copy,
      nicky_quote: { ...copy.nicky_quote, response: v },
    };
  }
  const m = path.match(/^body_blocks\[(\d+)\]\.(title|description|cta|cta_href)$/);
  if (m) {
    const i = parseInt(m[1], 10);
    const field = m[2] as "title" | "description" | "cta" | "cta_href";
    return {
      ...copy,
      body_blocks: copy.body_blocks.map((b, idx) =>
        idx === i ? { ...b, [field]: v } : b,
      ),
    };
  }
  return copy;
}

export function stripCampaignId(
  copy: ApprovedCopy,
): Omit<ApprovedCopy, "campaign_id"> {
  const { campaign_id: _ignored, ...rest } = copy;
  void _ignored;
  return rest;
}

// Heuristic: paths whose value is typically a sentence or paragraph want
// a textarea; short labels like subject / preheader / cta / cta_href
// want a single-line input that submits on Enter.
export function pathIsMultiline(path: string): boolean {
  return (
    path.endsWith(".description") ||
    path === "nicky_quote.quote" ||
    path === "sms"
  );
}
