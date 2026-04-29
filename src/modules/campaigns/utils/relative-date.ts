// Compact relative-date formatter for the campaign list.
// Matches the design language: "in 2d", "today", "yesterday", "12d ago".
// Beyond ±14 days falls back to "Apr 15"-style short dates so the column
// stays scannable without expanding.

const DAY_MS = 24 * 60 * 60 * 1000;
const RELATIVE_WINDOW_DAYS = 14;

export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const startOfDate = startOfDay(date);
  const startOfNow = startOfDay(now);
  const diffDays = Math.round(
    (startOfDate.getTime() - startOfNow.getTime()) / DAY_MS,
  );

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 1 && diffDays < RELATIVE_WINDOW_DAYS) return `in ${diffDays}d`;
  if (diffDays < -1 && diffDays > -RELATIVE_WINDOW_DAYS) {
    return `${Math.abs(diffDays)}d ago`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}
