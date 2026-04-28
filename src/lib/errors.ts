import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Domain errors thrown by actions / services. Each carries the HTTP status
// it should map to so route handlers can stay free of mapping logic — they
// just delegate to handleRouteError(err) in the catch block.

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  readonly issues?: unknown;

  constructor(message: string, issues?: unknown) {
    super(message, 400, "validation_error");
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "not_found");
    this.name = "NotFoundError";
  }
}

export class CampaignError extends AppError {
  constructor(message: string, statusCode = 400) {
    super(message, statusCode, "campaign_error");
    this.name = "CampaignError";
  }
}

export class LLMError extends AppError {
  constructor(message: string, statusCode = 502) {
    super(message, statusCode, "llm_error");
    this.name = "LLMError";
  }
}

export class FeedError extends AppError {
  constructor(message: string, statusCode = 502) {
    super(message, statusCode, "feed_error");
    this.name = "FeedError";
  }
}

interface ErrorBody {
  error: string;
  code?: string;
  issues?: unknown;
}

// Single mapping point used by every route's catch block. Known errors
// surface their declared statusCode + code; ZodError flattens to
// `validation_error` with field-level issues; plain Errors fall through
// at `defaultStatus` (each route picks the right status for its surface —
// 400 for input-driven endpoints, 500/502 for upstream-call endpoints).
export function handleRouteError(
  err: unknown,
  fallbackMessage = "Something went wrong",
  defaultStatus = 400,
): NextResponse<ErrorBody> {
  if (err instanceof AppError) {
    const body: ErrorBody = { error: err.message, code: err.code };
    if (err instanceof ValidationError && err.issues !== undefined) {
      body.issues = err.issues;
    }
    return NextResponse.json(body, { status: err.statusCode });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        code: "validation_error",
        issues: err.flatten(),
      },
      { status: 400 },
    );
  }
  if (err instanceof Error) {
    return NextResponse.json({ error: err.message }, { status: defaultStatus });
  }
  // Non-Error throwables are programming errors — always 500.
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
