import { describe, it, expect } from "vitest";
import type { CampaignBlueprint } from "@/lib/types";
import {
  StubFigmaService,
  figmaService,
} from "@/modules/figma/services/figma-service";

function makeBlueprint(overrides: Partial<CampaignBlueprint> = {}): CampaignBlueprint {
  return {
    campaign_id: "cmp_test",
    lead_value: "joy",
    lead_personalities: ["joyfully_characterful"],
    free_top_text: null,
    subject_variant: {
      subject: "Hello",
      preheader: "World",
    },
    hero_image_url: "https://cdn.theograce.com/hero.jpg",
    body_blocks: [
      {
        title: "Made for you",
        description: "A lovely thing",
        cta: "Shop",
      },
    ],
    sms: null,
    products: [],
    ...overrides,
  };
}

describe("StubFigmaService.getAvailableTemplates", () => {
  it("returns a non-empty list of templates", async () => {
    const svc = new StubFigmaService({ latencyMs: 0 });
    const templates = await svc.getAvailableTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it("each template exposes id + name", async () => {
    const svc = new StubFigmaService({ latencyMs: 0 });
    const templates = await svc.getAvailableTemplates();
    for (const t of templates) {
      expect(typeof t.id).toBe("string");
      expect(typeof t.name).toBe("string");
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.name.length).toBeGreaterThan(0);
    }
  });
});

describe("StubFigmaService.fillTemplates", () => {
  it("returns one FilledVariant per template, wired to the blueprint's campaign_id", async () => {
    const svc = new StubFigmaService({ latencyMs: 0 });
    const templates = await svc.getAvailableTemplates();
    const variants = await svc.fillTemplates(
      makeBlueprint({ campaign_id: "cmp_abc123" }),
    );

    expect(variants).toHaveLength(templates.length);
    for (const v of variants) {
      expect(v.variantName).toBeTruthy();
      expect(v.figmaFrameUrl).toContain("cmp_abc123");
    }
  });

  it("variant names mirror the available templates", async () => {
    const svc = new StubFigmaService({ latencyMs: 0 });
    const templates = await svc.getAvailableTemplates();
    const variants = await svc.fillTemplates(makeBlueprint());
    const templateNames = templates.map((t) => t.name).sort();
    const variantNames = variants.map((v) => v.variantName).sort();
    expect(variantNames).toEqual(templateNames);
  });

  it("awaits the configured latency before resolving", async () => {
    const svc = new StubFigmaService({ latencyMs: 50 });
    const start = Date.now();
    await svc.fillTemplates(makeBlueprint());
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);
  });
});

describe("StubFigmaService.exportThumbnails", () => {
  it("returns one URL per variant", async () => {
    const svc = new StubFigmaService({ latencyMs: 0 });
    const variants = await svc.fillTemplates(makeBlueprint());
    const thumbnails = await svc.exportThumbnails(variants);
    expect(thumbnails).toHaveLength(variants.length);
    for (const url of thumbnails) {
      expect(typeof url).toBe("string");
      expect(url.length).toBeGreaterThan(0);
    }
  });
});

describe("figmaService singleton", () => {
  it("is an instance of StubFigmaService", () => {
    expect(figmaService).toBeInstanceOf(StubFigmaService);
  });

  it("exposes the FigmaService interface methods", () => {
    expect(typeof figmaService.getAvailableTemplates).toBe("function");
    expect(typeof figmaService.fillTemplates).toBe("function");
    expect(typeof figmaService.exportThumbnails).toBe("function");
  });
});
