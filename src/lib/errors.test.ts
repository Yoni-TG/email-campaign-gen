import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  AppError,
  CampaignError,
  FeedError,
  LLMError,
  NotFoundError,
  ValidationError,
  handleRouteError,
} from "./errors";

describe("AppError hierarchy", () => {
  it("CampaignError defaults to 400", () => {
    const err = new CampaignError("bad campaign");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("campaign_error");
  });

  it("LLMError + FeedError default to 502", () => {
    expect(new LLMError("upstream").statusCode).toBe(502);
    expect(new FeedError("upstream").statusCode).toBe(502);
  });

  it("NotFoundError is 404", () => {
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new NotFoundError().message).toBe("Not found");
  });

  it("ValidationError carries issues", () => {
    const err = new ValidationError("invalid", { sku: "missing" });
    expect(err.statusCode).toBe(400);
    expect(err.issues).toEqual({ sku: "missing" });
  });
});

describe("handleRouteError", () => {
  it("maps AppError statusCode + code", async () => {
    const res = handleRouteError(new NotFoundError("campaign 42"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "campaign 42", code: "not_found" });
  });

  it("includes ValidationError issues when present", async () => {
    const res = handleRouteError(
      new ValidationError("bad input", { name: "required" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("validation_error");
    expect(body.issues).toEqual({ name: "required" });
  });

  it("flattens ZodError to a 400 validation response", async () => {
    const schema = z.object({ name: z.string().min(1) });
    let caught: unknown;
    try {
      schema.parse({ name: "" });
    } catch (e) {
      caught = e;
    }
    const res = handleRouteError(caught);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("validation_error");
    expect(body.issues).toBeDefined();
  });

  it("falls back to 400 + message for plain Error", async () => {
    const res = handleRouteError(new Error("kaboom"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "kaboom" });
  });

  it("falls back to 500 + fallback message for non-Error throwables", async () => {
    const res = handleRouteError("string thrown", "fallback msg");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "fallback msg" });
  });

  it("preserves AppError subclass codes", async () => {
    const res = handleRouteError(new LLMError("Anthropic 503"));
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.code).toBe("llm_error");
    expect(body.error).toBe("Anthropic 503");
  });

  it("AppError instanceof check still works on subclasses", () => {
    const err = new CampaignError("x");
    expect(err instanceof AppError).toBe(true);
    expect(err instanceof CampaignError).toBe(true);
  });
});
