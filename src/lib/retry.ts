// Resilience primitives used by the LLM-call sites. Two independent helpers:
//   withRetry — exponential backoff over transient HTTP failures (429 + 5xx).
//   withTimeout — AbortController-driven cap; surfaces TimeoutError when the
//                 inner work runs past the deadline.
// They compose: a withTimeout(signal => withRetry(() => fn(signal), { signal }))
// gets you "retry transients within a 60 s budget; bail with TimeoutError after."

export class TimeoutError extends Error {
  constructor(message = "Operation timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export interface RetryOptions {
  /** Maximum total attempts including the first one. Default 3. */
  maxAttempts?: number;
  /** First-retry delay in ms. Doubles each attempt. Default 1000. */
  baseDelayMs?: number;
  /** Predicate. Default treats `err.status` 429 + 5xx as retryable. */
  isRetryable?: (err: unknown) => boolean;
  /** External abort signal — checked between attempts to bail out fast. */
  signal?: AbortSignal;
  /** Hook for logging / metrics on each retry attempt (1-indexed). */
  onRetry?: (err: unknown, attempt: number) => void;
}

export function isRetryableHttpError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  // Aborts are user/timeout cancellations — never retry them.
  if (err.name === "AbortError" || err.name === "APIUserAbortError") return false;
  const status = (err as { status?: unknown }).status;
  if (typeof status === "number") {
    return status === 429 || (status >= 500 && status < 600);
  }
  return false;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const max = opts.maxAttempts ?? 3;
  const base = opts.baseDelayMs ?? 1000;
  const retryable = opts.isRetryable ?? isRetryableHttpError;

  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return await fn();
    } catch (err) {
      // External abort wins over retry — bail out without sleeping.
      if (opts.signal?.aborted) throw err;
      if (attempt >= max || !retryable(err)) throw err;
      opts.onRetry?.(err, attempt);
      await sleep(base * Math.pow(2, attempt - 1), opts.signal);
    }
  }
}

export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
  message = "Operation timed out",
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new TimeoutError(message)), ms);
  try {
    return await fn(ctrl.signal);
  } catch (err) {
    // The inner fn might surface the abort as its own typed error
    // (the Anthropic SDK throws APIUserAbortError, fetch throws AbortError).
    // Prefer our typed TimeoutError so the caller can branch on it
    // without needing to know the inner abstraction.
    if (ctrl.signal.aborted) throw new TimeoutError(message);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
