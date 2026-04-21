"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ApprovedCopy,
  BodyBlock,
  GeneratedCopy,
  NickyQuote,
  SubjectVariant,
} from "@/lib/types";

interface CopyEditorProps {
  generatedCopy: GeneratedCopy;
  value: ApprovedCopy;
  onChange: (copy: ApprovedCopy) => void;
}

function sameVariant(a: SubjectVariant, b: SubjectVariant): boolean {
  return a.subject === b.subject && a.preheader === b.preheader;
}

// Strings bound to form inputs can't be null; the wire format uses null for
// "omit", so we swap at the boundary.
const nullToEmpty = (v: string | null) => v ?? "";
const emptyToNull = (v: string) => (v.trim().length > 0 ? v : null);

export function CopyEditor({ generatedCopy, value, onChange }: CopyEditorProps) {
  const patch = (partial: Partial<ApprovedCopy>) =>
    onChange({ ...value, ...partial });

  const patchBlock = (index: number, partial: Partial<BodyBlock>) => {
    const next = value.body_blocks.map((block, i) =>
      i === index ? { ...block, ...partial } : block,
    );
    patch({ body_blocks: next });
  };

  const patchNicky = (partial: Partial<NickyQuote>) => {
    const next: NickyQuote = {
      quote: value.nicky_quote?.quote ?? "",
      response: value.nicky_quote?.response ?? null,
      ...partial,
    };
    // Empty quote = clear the whole slot.
    patch({ nicky_quote: next.quote.trim().length > 0 ? next : null });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <Label className="text-base font-semibold">Subject &amp; Preheader</Label>
          <p className="text-xs text-muted-foreground">
            Generated options — pick one, then edit freely.
          </p>
        </div>
        {generatedCopy.subject_variants.length > 1 && (
          <div className="space-y-2">
            {generatedCopy.subject_variants.map((variant, i) => (
              <button
                key={i}
                type="button"
                onClick={() => patch({ subject_variant: { ...variant } })}
                className={`w-full rounded border p-2 text-left text-sm transition-colors ${
                  sameVariant(value.subject_variant, variant)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <p className="font-medium">{variant.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {variant.preheader}
                </p>
              </button>
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-sm">Subject</Label>
          <Input
            value={value.subject_variant.subject}
            onChange={(e) =>
              patch({
                subject_variant: {
                  ...value.subject_variant,
                  subject: e.target.value,
                },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Preheader</Label>
          <Input
            value={value.subject_variant.preheader}
            onChange={(e) =>
              patch({
                subject_variant: {
                  ...value.subject_variant,
                  preheader: e.target.value,
                },
              })
            }
          />
        </div>
      </section>

      <section className="space-y-1.5">
        <Label className="text-base font-semibold">Free Top Text</Label>
        <p className="text-xs text-muted-foreground">
          Optional banner above the hero. Leave empty to omit.
        </p>
        <Input
          value={nullToEmpty(value.free_top_text)}
          onChange={(e) => patch({ free_top_text: emptyToNull(e.target.value) })}
          placeholder="e.g. TIMELESS. ALWAYS HAS BEEN"
        />
      </section>

      <section className="space-y-4">
        <Label className="text-base font-semibold">Body Blocks</Label>
        {value.body_blocks.map((block, i) => (
          <div
            key={i}
            className="space-y-3 rounded-md border border-border/60 bg-muted/40 p-3"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Block {i + 1}
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm">Title</Label>
              <Input
                value={nullToEmpty(block.title)}
                onChange={(e) =>
                  patchBlock(i, { title: emptyToNull(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Description</Label>
              <Textarea
                value={nullToEmpty(block.description)}
                onChange={(e) =>
                  patchBlock(i, { description: emptyToNull(e.target.value) })
                }
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">CTA</Label>
              <Input
                value={nullToEmpty(block.cta)}
                onChange={(e) =>
                  patchBlock(i, { cta: emptyToNull(e.target.value) })
                }
              />
            </div>
          </div>
        ))}
      </section>

      {(generatedCopy.sms !== null || value.sms !== null) && (
        <section className="space-y-1.5">
          <Label className="text-base font-semibold">SMS</Label>
          <p className="text-xs text-muted-foreground">
            ≤130 chars. Use <code>{"{link}"}</code> as the URL placeholder.
          </p>
          <Textarea
            value={nullToEmpty(value.sms)}
            onChange={(e) => patch({ sms: emptyToNull(e.target.value) })}
            rows={2}
          />
        </section>
      )}

      <section className="space-y-3">
        <div>
          <Label className="text-base font-semibold">Nicky Quote</Label>
          <p className="text-xs text-muted-foreground">
            Brand-guide §7 — use when a claim would sound boastful in our
            voice. Clear the quote to omit.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Quote</Label>
          <Textarea
            value={value.nicky_quote?.quote ?? ""}
            onChange={(e) => patchNicky({ quote: e.target.value })}
            placeholder="Short, specific, on-persona quote from Nicky."
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Response (optional)</Label>
          <Input
            value={value.nicky_quote?.response ?? ""}
            onChange={(e) =>
              patchNicky({ response: emptyToNull(e.target.value) })
            }
            placeholder='e.g. "Thank you Nicky!"'
            disabled={!value.nicky_quote}
          />
        </div>
      </section>
    </div>
  );
}
