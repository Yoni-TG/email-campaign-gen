import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TimeoutError,
  isRetryableHttpError,
  withRetry,
  withTimeout,
} from "./retry";

class HttpError extends Error {
  status: number;
  constructor(status: number, message = `HTTP ${status}`) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

describe("isRetryableHttpError", () => {
  it("retries 429 and 5xx", () => {
    expect(isRetryableHttpError(new HttpError(429))).toBe(true);
    expect(isRetryableHttpError(new HttpError(500))).toBe(true);
    expect(isRetryableHttpError(new HttpError(502))).toBe(true);
    expect(isRetryableHttpError(new HttpError(599))).toBe(true);
  });

  it("does not retry 4xx other than 429", () => {
    expect(isRetryableHttpError(new HttpError(400))).toBe(false);
    expect(isRetryableHttpError(new HttpError(401))).toBe(false);
    expect(isRetryableHttpError(new HttpError(404))).toBe(false);
  });

  it("does not retry abort errors", () => {
    const ab = new Error("aborted");
    ab.name = "AbortError";
    expect(isRetryableHttpError(ab)).toBe(false);
    const sdkAb = new Error("aborted");
    sdkAb.name = "APIUserAbortError";
    expect(isRetryableHttpError(sdkAb)).toBe(false);
  });

  it("does not retry errors without a numeric status", () => {
    expect(isRetryableHttpError(new Error("plain"))).toBe(false);
    expect(isRetryableHttpError("string thrown")).toBe(false);
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the value when fn succeeds first try", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on 429 then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new HttpError(429))
      .mockResolvedValueOnce("ok");
    const promise = withRetry(fn, { baseDelayMs: 10 });
    await vi.advanceTimersByTimeAsync(10);
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses exponential backoff: 1s, 2s, 4s", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new HttpError(503))
      .mockRejectedValueOnce(new HttpError(503))
      .mockResolvedValueOnce("ok");
    const promise = withRetry(fn, { baseDelayMs: 1000, maxAttempts: 3 });
    // First retry: 1000ms after attempt 1.
    await vi.advanceTimersByTimeAsync(999);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    // Second retry: 2000ms after attempt 2.
    await vi.advanceTimersByTimeAsync(1999);
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry 400", async () => {
    const fn = vi.fn().mockRejectedValue(new HttpError(400, "bad request"));
    await expect(withRetry(fn, { baseDelayMs: 10 })).rejects.toThrow(
      "bad request",
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after maxAttempts and rethrows the last error", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new HttpError(503, "first"))
      .mockRejectedValueOnce(new HttpError(503, "second"))
      .mockRejectedValueOnce(new HttpError(503, "third"));
    const promise = withRetry(fn, { baseDelayMs: 10, maxAttempts: 3 });
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(promise).rejects.toThrow("third");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("calls onRetry hook with each retried error", async () => {
    const onRetry = vi.fn();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new HttpError(500, "first"))
      .mockResolvedValueOnce("ok");
    const promise = withRetry(fn, { baseDelayMs: 10, onRetry });
    await vi.advanceTimersByTimeAsync(10);
    await promise;
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(HttpError), 1);
  });

  it("aborts during the backoff sleep when external signal fires", async () => {
    const ctrl = new AbortController();
    const fn = vi.fn().mockRejectedValue(new HttpError(503));
    const promise = withRetry(fn, {
      baseDelayMs: 1000,
      maxAttempts: 3,
      signal: ctrl.signal,
    });
    // Let the first call kick off + start the sleep, then abort.
    await Promise.resolve();
    ctrl.abort();
    await expect(promise).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with the inner value when fn completes before the deadline", async () => {
    const out = await withTimeout(async () => "done", 1000);
    expect(out).toBe("done");
  });

  it("throws a typed TimeoutError when the deadline elapses", async () => {
    const promise = withTimeout(
      (signal) =>
        new Promise<string>((_, reject) => {
          signal.addEventListener("abort", () =>
            reject(new Error("inner-aborted")),
          );
        }),
      100,
      "took too long",
    );
    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).rejects.toBeInstanceOf(TimeoutError);
    await expect(promise).rejects.toThrow("took too long");
  });

  it("propagates inner errors that fire before the deadline", async () => {
    const promise = withTimeout(async () => {
      throw new Error("inner blew up");
    }, 1000);
    await expect(promise).rejects.toThrow("inner blew up");
  });

  it("clears the timer on success so it doesn't leak", async () => {
    const out = await withTimeout(async () => 42, 60_000);
    expect(out).toBe(42);
    // Advancing past the deadline should not surface a stray rejection.
    await vi.advanceTimersByTimeAsync(120_000);
  });
});
