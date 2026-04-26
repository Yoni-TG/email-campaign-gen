-- Replaces the Figma integration with the email-templates renderer pipeline.
-- 1. Maps any in-flight statuses from the old Figma flow onto the new flow.
--    hero_upload   → review               (re-do CP1; the upload step has moved)
--    filling_figma → rendering_candidates (rerun render against new pipeline)
--    variant_selection stays as-is (the new flow keeps this status name).
-- 2. Drops figma_result (data on the 2 dev rows that have it is no longer
--    meaningful — those rows previously held Figma frame URLs).
-- 3. Adds render_result, candidate_variants, chosen_skeleton_id, asset_paths.

UPDATE "campaigns" SET "status" = 'review' WHERE "status" = 'hero_upload';
UPDATE "campaigns" SET "status" = 'rendering_candidates' WHERE "status" = 'filling_figma';

ALTER TABLE "campaigns" DROP COLUMN "figma_result";

ALTER TABLE "campaigns" ADD COLUMN "render_result" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "candidate_variants" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "chosen_skeleton_id" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "asset_paths" TEXT;
