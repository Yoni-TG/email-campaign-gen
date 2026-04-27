-- CreateTable
CREATE TABLE "klaviyo_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "window_start" DATETIME NOT NULL,
    "window_end" DATETIME NOT NULL,
    "metrics" TEXT NOT NULL,
    "fetched_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "klaviyo_metrics_scope_idx" ON "klaviyo_metrics"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "klaviyo_metrics_scope_window_uq" ON "klaviyo_metrics"("scope", "window_start");
