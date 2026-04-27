-- Adds the block_overrides JSON column for per-block prop overrides
-- (currently used for background-colour fine-tuning at edit time).

ALTER TABLE "campaigns" ADD COLUMN "block_overrides" TEXT;
