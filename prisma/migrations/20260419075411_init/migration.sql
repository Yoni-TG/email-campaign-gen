-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "campaign_type" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "seed" TEXT NOT NULL,
    "generated_copy" TEXT,
    "approved_copy" TEXT,
    "generated_products" TEXT,
    "approved_products" TEXT,
    "hero_image_path" TEXT,
    "figma_result" TEXT,
    "error" TEXT
);
