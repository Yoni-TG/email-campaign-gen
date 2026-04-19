import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

process.env.ANTHROPIC_API_KEY = "test-key";
process.env.PRODUCT_FEED_URL =
  "https://static.myka.com/us-east-1/imported-feeds/51/email-marketing.json";
process.env.CLAUDE_MODEL = "claude-sonnet-4-6";

export { vi };
