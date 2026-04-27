import type { CampaignRow, ReportData } from "./report";

export function formatReportAsMarkdown(report: ReportData): string {
  const { summary } = report;
  const lines: string[] = [];

  lines.push(`# Klaviyo campaign report`);
  lines.push("");
  lines.push(
    `**Window:** ${formatDate(summary.windowStart)} → ${formatDate(summary.windowEnd)}`,
  );
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Total campaigns | ${summary.totalCampaigns} |`);
  lines.push(`| Campaigns with stats | ${summary.campaignsWithStats} |`);
  lines.push(`| Total recipients | ${formatInt(summary.totalRecipients)} |`);
  lines.push(`| Total revenue | ${formatRevenue(summary.totalRevenue)} |`);
  lines.push(`| Mean open rate | ${pct(summary.meanOpenRate)} |`);
  lines.push(`| Median open rate | ${pct(summary.medianOpenRate)} |`);
  lines.push(`| Mean click rate | ${pct(summary.meanClickRate)} |`);
  lines.push(`| Median click rate | ${pct(summary.medianClickRate)} |`);
  lines.push(`| Mean conversion rate | ${pctConv(summary.meanConversionRate)} |`);
  lines.push(`| Mean recipients / send | ${formatInt(Math.round(summary.meanRecipients))} |`);
  lines.push("");

  lines.push(...section("Top by open rate", report.topByOpenRate, "openRate"));
  lines.push(...section("Top by click rate", report.topByClickRate, "clickRate"));
  lines.push(
    ...section("Top by conversion rate", report.topByConversionRate, "conversionRate"),
  );
  lines.push(...section("Top by revenue", report.topByRevenue, "revenue"));
  lines.push(
    ...section(
      "Top by revenue per recipient (efficiency, normalised for audience size)",
      report.topByRevenuePerRecipient,
      "revenuePerRecipient",
    ),
  );
  lines.push(
    ...section("Bottom by open rate (for contrast)", report.bottomByOpenRate, "openRate"),
  );

  return lines.join("\n") + "\n";
}

function section(
  title: string,
  rows: CampaignRow[],
  highlight: keyof Pick<
    CampaignRow,
    "openRate" | "clickRate" | "conversionRate" | "revenue" | "revenuePerRecipient"
  >,
): string[] {
  const lines: string[] = [];
  lines.push(`## ${title}`);
  lines.push("");
  if (rows.length === 0) {
    lines.push("_No data._");
    lines.push("");
    return lines;
  }
  lines.push(
    `| # | Sent | Subject | Recipients | Delivered | Open | Click | Conv | Rev | $/recip | ${labelFor(highlight)} |`,
  );
  lines.push(`|---|---|---|---|---|---|---|---|---|---|---|`);
  rows.forEach((row, idx) => {
    lines.push(
      `| ${idx + 1} | ${formatDate(row.sentAt)} | ${escape(row.subject)} | ${formatInt(row.recipients)} | ${formatInt(row.delivered)} | ${pct(row.openRate)} | ${pct(row.clickRate)} | ${pctConv(row.conversionRate)} | ${formatRevenue(row.revenue)} | ${formatPerRecipient(row.revenuePerRecipient)} | **${formatHighlight(row, highlight)}** |`,
    );
  });
  lines.push("");
  return lines;
}

function labelFor(field: string): string {
  switch (field) {
    case "openRate":
      return "Open rate";
    case "clickRate":
      return "Click rate";
    case "conversionRate":
      return "Conv rate";
    case "revenue":
      return "Revenue";
    case "revenuePerRecipient":
      return "$/recip";
    default:
      return field;
  }
}

function formatHighlight(row: CampaignRow, field: keyof CampaignRow): string {
  const v = row[field];
  if (typeof v !== "number") return "";
  if (field === "revenue") return formatRevenue(v);
  if (field === "revenuePerRecipient") return formatPerRecipient(v);
  if (field === "conversionRate") return pctConv(v);
  return pct(v);
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Conversion rate is two orders of magnitude smaller than open/click — needs more decimals to be readable. */
function pctConv(value: number): string {
  return `${(value * 100).toFixed(3)}%`;
}

function formatRevenue(value: number): string {
  return `$${formatInt(Math.round(value))}`;
}

function formatPerRecipient(value: number): string {
  return `$${value.toFixed(3)}`;
}

function formatInt(value: number): string {
  return value.toLocaleString("en-US");
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function escape(value: string): string {
  return value.replace(/\|/g, "\\|");
}
