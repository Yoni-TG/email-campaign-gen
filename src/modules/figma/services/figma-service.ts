import type {
  CampaignBlueprint,
  FigmaService,
  FigmaTemplate,
  FilledVariant,
} from "@/lib/types";

export interface StubFigmaServiceOptions {
  /**
   * How long fillTemplates takes to resolve, in ms. Defaults to 2s in
   * non-test runs so the UI can exercise its "filling_figma" loading state;
   * tests should pass 0 (or a tiny value) to stay fast.
   */
  latencyMs?: number;
}

const DEFAULT_LATENCY_MS = process.env.NODE_ENV === "test" ? 0 : 2000;

const TEMPLATES: FigmaTemplate[] = [
  { id: "template-mosaic", name: "Mosaic Grid" },
  { id: "template-list", name: "Product List" },
  { id: "template-hero-banner", name: "Hero Banner" },
];

const THUMBNAIL_SIZE = "648x900";

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stub FigmaService — returns canned templates, mock variant frame URLs
 * tied to the campaign_id, and placeholder thumbnails. Swap for a real
 * implementation (REST API or plugin bridge) once the Phase-1 spike lands.
 */
export class StubFigmaService implements FigmaService {
  private readonly latencyMs: number;

  constructor(options: StubFigmaServiceOptions = {}) {
    this.latencyMs = options.latencyMs ?? DEFAULT_LATENCY_MS;
  }

  async getAvailableTemplates(): Promise<FigmaTemplate[]> {
    return [...TEMPLATES];
  }

  async fillTemplates(blueprint: CampaignBlueprint): Promise<FilledVariant[]> {
    const templates = await this.getAvailableTemplates();
    await sleep(this.latencyMs);

    return templates.map((template) => ({
      variantName: template.name,
      figmaFrameUrl: `https://www.figma.com/file/stub/${blueprint.campaign_id}?node-id=${template.id}`,
    }));
  }

  async exportThumbnails(variants: FilledVariant[]): Promise<string[]> {
    return variants.map(
      (_, i) =>
        `https://placehold.co/${THUMBNAIL_SIZE}/f3f4f6/a1a1aa?text=Variant+${i + 1}`,
    );
  }
}

/**
 * Singleton instance used by the API routes / UI. Consumers should import
 * this rather than constructing their own — swapping stub → real is a
 * single-line change here.
 */
export const figmaService: FigmaService = new StubFigmaService();
