// Server errors can be huge (Prisma stack traces ramble). Clip to one
// line so the toast doesn't dominate the screen — the full payload is
// still visible in the network tab if the operator needs to forward it.
export function shortError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : fallback;
  const firstLine = raw.split("\n")[0] ?? raw;
  if (firstLine.length <= 140) return firstLine;
  return firstLine.slice(0, 140) + "…";
}
