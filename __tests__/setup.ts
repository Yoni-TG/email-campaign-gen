import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

process.env.ANTHROPIC_API_KEY = "test-key";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ACCESS_KEY_ID = "test-access-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key";
process.env.S3_BUCKET_NAME = "test-bucket";
process.env.S3_FEED_KEY = "feed.json";
process.env.CLAUDE_MODEL = "claude-sonnet-4-6";

export { vi };
