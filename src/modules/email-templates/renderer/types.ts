// The renderer consumes the same CampaignBlueprint produced by buildBlueprint
// (campaigns/utils/build-blueprint.ts) — re-exported here as RendererBlueprint
// so the renderer module's API stays self-contained.

export type { CampaignBlueprint as RendererBlueprint } from "@/lib/types";
