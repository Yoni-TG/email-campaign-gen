# `data/` — local runtime fixtures

Files here support local dev without hitting external services.

## `product-feed.fixture.json` (gitignored)

A snapshot of the custom `email-marketing.json` product feed. Used as the
local fallback source for the product-feed service
(`src/modules/products/services/product-feed.ts`).

**Not committed** — contains supplier fields (`SupplierProductId`,
`SupplierName`) that shouldn't land in git. Each developer drops their own
copy at this path.

### How to obtain

1. Download the latest snapshot from `PRODUCT_FEED_URL` (the same URL the
   remote source uses at runtime).
2. Save it at `data/product-feed.fixture.json` in the repo root.

### How the service picks remote vs local

The feed loader dispatches based on `PRODUCT_FEED_SOURCE`:

| `PRODUCT_FEED_SOURCE` | `PRODUCT_FEED_URL` | Behavior |
| --- | --- | --- |
| `remote`              | _any_              | Force remote (fetch from CDN URL) |
| `local`               | _any_              | Force local file |
| _unset_               | set                | Use remote (default prod behavior) |
| _unset_               | unset              | Use local file (default dev-without-URL experience) |

Local path can be overridden with `PRODUCT_FEED_LOCAL_PATH`.

## `product-feed.fixture.sample.json` (committed)

Tiny hand-crafted fixture used by the test suite to exercise the local
code path without requiring the real 5–10 MB feed copy on the machine.
Shape matches the `FeedProduct` type in `src/lib/types.ts`.
