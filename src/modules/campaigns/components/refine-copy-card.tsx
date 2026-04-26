"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApprovedCopy, Campaign } from "@/lib/types";

// Fine-tune card on the completed view — inline editor for the approved
// copy (subject, preheader, free top text, body blocks, Nicky quote, SMS).
// Updates approvedCopy and re-renders in one round trip via
// /fine-tune/copy. Reuses the existing approved values as initial form
// state so the operator can spot-edit a single field.

interface FormState {
  subject: string;
  preheader: string;
  freeTopText: string;
  bodyBlocks: Array<{ title: string; description: string; cta: string }>;
  nickyQuote: string;
  nickyResponse: string;
  sms: string;
}

function fromCopy(copy: ApprovedCopy): FormState {
  return {
    subject: copy.subject_variant.subject,
    preheader: copy.subject_variant.preheader,
    freeTopText: copy.free_top_text ?? "",
    bodyBlocks: copy.body_blocks.map((b) => ({
      title: b.title ?? "",
      description: b.description ?? "",
      cta: b.cta ?? "",
    })),
    nickyQuote: copy.nicky_quote?.quote ?? "",
    nickyResponse: copy.nicky_quote?.response ?? "",
    sms: copy.sms ?? "",
  };
}

function toCopyPayload(state: FormState): Omit<ApprovedCopy, "campaign_id"> {
  const nickyQuote = state.nickyQuote.trim();
  return {
    subject_variant: {
      subject: state.subject,
      preheader: state.preheader,
    },
    free_top_text: state.freeTopText.trim() || null,
    body_blocks: state.bodyBlocks.map((b) => ({
      title: b.title.trim() || null,
      description: b.description.trim() || null,
      cta: b.cta.trim() || null,
    })),
    nicky_quote: nickyQuote
      ? { quote: nickyQuote, response: state.nickyResponse.trim() || null }
      : null,
    sms: state.sms.trim() || null,
  };
}

export function RefineCopyCard({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  if (!campaign.approvedCopy) return null;

  const [form, setForm] = useState<FormState>(() =>
    fromCopy(campaign.approvedCopy!),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateBlock = (
    index: number,
    field: "title" | "description" | "cta",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      bodyBlocks: prev.bodyBlocks.map((b, i) =>
        i === index ? { ...b, [field]: value } : b,
      ),
    }));
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/fine-tune/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedCopy: toCopyPayload(form) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      toast.success("Copy updated — re-rendered.");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Refine copy</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? "Collapse" : "Edit"}
        </Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Tweak any line of approved copy and re-render without going back
        through CP1.
      </p>

      {isOpen && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ft-subject">Subject</Label>
              <Input
                id="ft-subject"
                value={form.subject}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subject: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ft-preheader">Preheader</Label>
              <Input
                id="ft-preheader"
                value={form.preheader}
                onChange={(e) =>
                  setForm((p) => ({ ...p, preheader: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ft-free-top">Free top text</Label>
            <Input
              id="ft-free-top"
              value={form.freeTopText}
              onChange={(e) =>
                setForm((p) => ({ ...p, freeTopText: e.target.value }))
              }
              placeholder="e.g. FREE DELIVERY"
            />
          </div>

          <div className="space-y-3">
            <Label>Body blocks</Label>
            {form.bodyBlocks.map((block, i) => (
              <div
                key={i}
                className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3"
              >
                <p className="text-xs font-mono text-muted-foreground">
                  body_blocks[{i}]
                </p>
                <Input
                  value={block.title}
                  onChange={(e) => updateBlock(i, "title", e.target.value)}
                  placeholder="Title"
                />
                <Textarea
                  value={block.description}
                  onChange={(e) =>
                    updateBlock(i, "description", e.target.value)
                  }
                  placeholder="Description"
                  rows={2}
                />
                <Input
                  value={block.cta}
                  onChange={(e) => updateBlock(i, "cta", e.target.value)}
                  placeholder="CTA label"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ft-nicky-quote">Nicky quote</Label>
              <Textarea
                id="ft-nicky-quote"
                value={form.nickyQuote}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nickyQuote: e.target.value }))
                }
                placeholder="Leave blank to skip."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ft-nicky-response">Nicky response</Label>
              <Input
                id="ft-nicky-response"
                value={form.nickyResponse}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nickyResponse: e.target.value }))
                }
                placeholder="Optional — e.g. Thank you Nicky!"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ft-sms">SMS</Label>
            <Textarea
              id="ft-sms"
              value={form.sms}
              onChange={(e) => setForm((p) => ({ ...p, sms: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save & Re-render"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
